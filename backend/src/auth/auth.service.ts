import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { CreateInviteDto } from './dto/create-invite.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {
    // Initialize email transporter
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: this.configService.get('SMTP_SECURE'),
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async createInvite(createInviteDto: CreateInviteDto) {
    const inviteToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + createInviteDto.expiresInHours);

    // Store invite token in Redis or database
    // For now, we'll return the token directly
    return {
      inviteToken,
      expiresAt,
      channelId: createInviteDto.channelId,
      role: createInviteDto.role,
    };
  }

  async sendMagicLink(email: string) {
    const magicToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    const magicLink = `${this.configService.get('FRONTEND_URL')}/auth/magic?token=${magicToken}`;

    try {
      await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM'),
        to: email,
        subject: 'VoxLink - Magic Link Login',
        html: `
          <h2>Welcome to VoxLink!</h2>
          <p>Click the link below to access your account:</p>
          <a href="${magicLink}">Login to VoxLink</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      });

      return { message: 'Magic link sent successfully' };
    } catch (error) {
      throw new BadRequestException('Failed to send magic link');
    }
  }

  async login(loginDto: LoginDto) {
    // Validate token (invite or magic link)
    // For now, we'll create a user if they don't exist
    let user = await this.usersRepository.findOne({
      where: { username: loginDto.username },
    });

    if (!user) {
      // Create new user
      user = this.usersRepository.create({
        username: loginDto.username || `user_${Date.now()}`,
        email: null, // Will be set later if provided
        role: 'member',
      });
      await this.usersRepository.save(user);
    }

    const payload = { 
      sub: user.id, 
      username: user.username, 
      role: user.role 
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async refreshToken(user: any) {
    const payload = { 
      sub: user.id, 
      username: user.username, 
      role: user.role 
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
