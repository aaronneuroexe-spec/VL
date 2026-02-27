import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { CreateInviteDto } from './dto/create-invite.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

const MAGIC_LINK_TTL = 60 * 60;        // 1 час в секундах
const INVITE_TTL = 60 * 60 * 24 * 7;  // 7 дней

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRedis()
    private redis: Redis,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  // ─── Регистрация ─────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    // Проверяем что username и email свободны
    const existingUsername = await this.usersRepository.findOne({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    const existingEmail = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepository.create({
      username: dto.username,
      email: dto.email,
      password: hashedPassword,
      role: 'member',
      status: 'online',
    });

    await this.usersRepository.save(user);
    return this.signUser(user);
  }

  // ─── Инвайт ─────────────────────────────────────────────────────────────

  async createInvite(dto: CreateInviteDto) {
    const inviteToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (dto.expiresInHours ?? 24 * 7));

    const inviteData = {
      channelId: dto.channelId ?? null,
      role: dto.role ?? 'member',
      expiresAt: expiresAt.toISOString(),
      uses: 0,
      maxUses: dto.maxUses ?? 1,
    };

    try {
      await this.redis.setex(
        `invite:${inviteToken}`,
        INVITE_TTL,
        JSON.stringify(inviteData),
      );
    } catch (e) {
      this.logger.error('Redis error while creating invite', e as any);
      throw new ServiceUnavailableException('Temporary storage unavailable');
    }

    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    return {
      inviteToken,
      inviteUrl: `${frontendUrl}/join?invite=${inviteToken}`,
      expiresAt,
      channelId: inviteData.channelId,
      role: inviteData.role,
    };
  }

  // ─── Magic Link ──────────────────────────────────────────────────────────

  async sendMagicLink(email: string) {
    const magicToken = uuidv4();
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const magicLink = `${frontendUrl}/auth/verify?token=${magicToken}`;

    try {
      await this.redis.setex(
        `magic:${magicToken}`,
        MAGIC_LINK_TTL,
        email,
      );
    } catch (e) {
      this.logger.error('Redis error while storing magic link', e as any);
      throw new ServiceUnavailableException('Temporary storage unavailable');
    }

    try {
      await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM', 'noreply@voxlink.com'),
        to: email,
        subject: 'VoxLink — вход в аккаунт',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #6366f1;">VoxLink</h2>
            <p>Привет! Нажми кнопку ниже чтобы войти в аккаунт:</p>
            <a href="${magicLink}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
              Войти в VoxLink
            </a>
            <p style="color:#888;font-size:13px;margin-top:16px;">
              Ссылка действует 1 час. Если ты не запрашивал вход — просто проигнорируй это письмо.
            </p>
          </div>
        `,
      });

      return { message: 'Magic link sent' };
    } catch (error) {
      this.logger.error('Failed to send magic link email', error);
      throw new BadRequestException('Failed to send magic link');
    }
  }

  async verifyMagicLink(token: string) {
    let email: string | null = null;
    try {
      email = await this.redis.get(`magic:${token}`);
    } catch (e) {
      this.logger.error('Redis error while verifying magic link', e as any);
      throw new ServiceUnavailableException('Temporary storage unavailable');
    }

    if (!email) {
      throw new UnauthorizedException('Invalid or expired magic link');
    }

    try {
      await this.redis.del(`magic:${token}`);
    } catch (e) {
      this.logger.warn('Failed to delete magic link key from Redis', e as any);
    }

    let user = await this.usersService.findByEmail(email);
    if (!user) {
      user = await this.usersService.create({
        email,
        username: `user_${Date.now()}`,
        role: 'member',
        status: 'online',
      });
    }

    return this.signUser(user);
  }

  // ─── Login по инвайту ────────────────────────────────────────────────────

  async login(loginDto: LoginDto) {
    if (loginDto.inviteToken) {
      let raw: string | null = null;
      try {
        raw = await this.redis.get(`invite:${loginDto.inviteToken}`);
      } catch (e) {
        this.logger.error('Redis error while reading invite token', e as any);
        throw new ServiceUnavailableException('Temporary storage unavailable');
      }

      if (!raw) {
        throw new UnauthorizedException('Invalid or expired invite token');
      }

      const invite = JSON.parse(raw);
      if (invite.maxUses && invite.uses >= invite.maxUses) {
        throw new UnauthorizedException('Invite has reached maximum uses');
      }

      invite.uses += 1;
      try {
        const ttl = await this.redis.ttl(`invite:${loginDto.inviteToken}`);
        await this.redis.setex(`invite:${loginDto.inviteToken}`, ttl, JSON.stringify(invite));
      } catch (e) {
        this.logger.error('Redis error while updating invite token', e as any);
        // Non-fatal: allow login to proceed even if we couldn't update invite usage
      }
    }

    let user = await this.usersRepository.findOne({
      where: { username: loginDto.username },
    });

    if (!user) {
      user = this.usersRepository.create({
        username: loginDto.username ?? `user_${Date.now()}`,
        email: loginDto.email ?? null,
        role: 'member',
        status: 'online',
      });
      await this.usersRepository.save(user);
    }

    return this.signUser(user);
  }

  // ─── Валидация пароля (для passport-local) ───────────────────────────────

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);
    if (user?.password && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async refreshToken(user: any) {
    return this.signUser(user);
  }

  // ─── Хелпер ─────────────────────────────────────────────────────────────

  private signUser(user: User) {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        status: user.status,
      },
    };
  }
}
