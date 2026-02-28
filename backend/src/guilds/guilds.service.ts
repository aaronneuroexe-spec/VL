import {
  Injectable, NotFoundException, ForbiddenException,
  BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Guild } from './entities/guild.entity';
import { GuildMember, MemberStatus } from './entities/guild-member.entity';
import { GuildRole, Permission, DEFAULT_PERMISSIONS } from './entities/guild-role.entity';
import { ChannelCategory } from './entities/channel-category.entity';
import { Channel, ChannelType } from '../channels/entities/channel.entity';
import { User } from '../users/entities/user.entity';
import { CreateGuildDto } from './dto/create-guild.dto';
import { UpdateGuildDto } from './dto/update-guild.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateGuildChannelDto } from './dto/create-channel.dto';
import { nanoid } from 'nanoid';

@Injectable()
export class GuildsService {
  constructor(
    @InjectRepository(Guild)
    private guildsRepo: Repository<Guild>,
    @InjectRepository(GuildMember)
    private membersRepo: Repository<GuildMember>,
    @InjectRepository(GuildRole)
    private rolesRepo: Repository<GuildRole>,
    @InjectRepository(ChannelCategory)
    private categoriesRepo: Repository<ChannelCategory>,
    @InjectRepository(Channel)
    private channelsRepo: Repository<Channel>,
  ) {}

  // ─── Создание гильдии ─────────────────────────────────────────────────────

  async create(dto: CreateGuildDto, owner: User): Promise<Guild> {
    const guild = this.guildsRepo.create({
      ...dto,
      ownerId: owner.id,
      inviteCode: nanoid(10),
    });
    await this.guildsRepo.save(guild);

    // Создаём системные роли
    const ownerRole = await this.rolesRepo.save(this.rolesRepo.create({
      name: 'Владелец',
      color: '#f1c40f',
      permissions: DEFAULT_PERMISSIONS.OWNER,
      position: 100,
      isManaged: true,
      guildId: guild.id,
    }));

    await this.rolesRepo.save(this.rolesRepo.create({
      name: 'Офицер',
      color: '#e74c3c',
      permissions: DEFAULT_PERMISSIONS.OFFICER,
      position: 50,
      isManaged: true,
      guildId: guild.id,
    }));

    await this.rolesRepo.save(this.rolesRepo.create({
      name: 'Участник',
      color: '#99aab5',
      permissions: DEFAULT_PERMISSIONS.MEMBER,
      position: 1,
      isManaged: true,
      guildId: guild.id,
    }));

    // Добавляем создателя как участника с ролью владельца
    const member = this.membersRepo.create({
      userId: owner.id,
      guildId: guild.id,
      status: MemberStatus.ACTIVE,
    });
    member.roles = [ownerRole];
    await this.membersRepo.save(member);

    // Создаём стартовые категории и каналы
    await this.createDefaultStructure(guild);

    return this.findOne(guild.id, owner);
  }

  private async createDefaultStructure(guild: Guild): Promise<void> {
    const textCategory = await this.categoriesRepo.save(this.categoriesRepo.create({
      name: 'ТЕКСТОВЫЕ КАНАЛЫ',
      position: 0,
      guildId: guild.id,
    }));

    const voiceCategory = await this.categoriesRepo.save(this.categoriesRepo.create({
      name: 'ГОЛОСОВЫЕ КАНАЛЫ',
      position: 1,
      guildId: guild.id,
    }));

    await this.channelsRepo.save([
      this.channelsRepo.create({
        name: 'общий',
        type: ChannelType.TEXT,
        guildId: guild.id,
        categoryId: textCategory.id,
        position: 0,
      }),
      this.channelsRepo.create({
        name: 'объявления',
        type: ChannelType.TEXT,
        guildId: guild.id,
        categoryId: textCategory.id,
        position: 1,
      }),
      this.channelsRepo.create({
        name: 'Общий',
        type: ChannelType.VOICE,
        guildId: guild.id,
        categoryId: voiceCategory.id,
        position: 0,
      }),
      this.channelsRepo.create({
        name: 'Рейд',
        type: ChannelType.VOICE,
        guildId: guild.id,
        categoryId: voiceCategory.id,
        position: 1,
      }),
    ]);
  }

  // ─── Получение ────────────────────────────────────────────────────────────

  async findAll(user: User): Promise<Guild[]> {
    // Гильдии где пользователь является участником
    return this.guildsRepo
      .createQueryBuilder('guild')
      .innerJoin('guild.members', 'member', 'member.userId = :userId AND member.status = :status', {
        userId: user.id,
        status: MemberStatus.ACTIVE,
      })
      .leftJoinAndSelect('guild.owner', 'owner')
      .select(['guild', 'owner.id', 'owner.username', 'owner.avatar'])
      .getMany();
  }

  async findOne(guildId: string, user: User): Promise<Guild> {
    const guild = await this.guildsRepo.findOne({
      where: { id: guildId },
      relations: ['owner', 'roles', 'categories', 'categories.channels'],
    });

    if (!guild) throw new NotFoundException('Guild not found');

    // Проверяем членство
    await this.getMemberOrThrow(guildId, user.id);

    // Сортируем категории и каналы по position
    guild.categories?.sort((a, b) => a.position - b.position);
    guild.categories?.forEach(cat => {
      cat.channels?.sort((a, b) => a.position - b.position);
    });

    return guild;
  }

  async update(guildId: string, dto: UpdateGuildDto, user: User): Promise<Guild> {
    await this.requirePermission(guildId, user.id, Permission.MANAGE_GUILD);
    await this.guildsRepo.update(guildId, dto);
    return this.findOne(guildId, user);
  }

  async delete(guildId: string, user: User): Promise<void> {
    const guild = await this.guildsRepo.findOne({ where: { id: guildId } });
    if (!guild) throw new NotFoundException('Guild not found');
    if (guild.ownerId !== user.id) throw new ForbiddenException('Only owner can delete guild');
    await this.guildsRepo.delete(guildId);
  }

  // ─── Инвайт ───────────────────────────────────────────────────────────────

  async getByInviteCode(inviteCode: string): Promise<Guild> {
    const guild = await this.guildsRepo.findOne({
      where: { inviteCode },
      relations: ['owner'],
      select: {
        id: true, name: true, description: true,
        icon: true, inviteCode: true,
        owner: { id: true, username: true, avatar: true },
      },
    });
    if (!guild) throw new NotFoundException('Invalid invite code');
    return guild;
  }

  async joinByInvite(inviteCode: string, user: User): Promise<GuildMember> {
    const guild = await this.guildsRepo.findOne({ where: { inviteCode } });
    if (!guild) throw new NotFoundException('Invalid invite code');

    const existing = await this.membersRepo.findOne({
      where: { guildId: guild.id, userId: user.id },
    });
    if (existing?.status === MemberStatus.ACTIVE) {
      throw new ConflictException('Already a member');
    }
    if (existing?.status === MemberStatus.BANNED) {
      throw new ForbiddenException('You are banned from this guild');
    }

    // Получаем роль "Участник"
    // Получаем роль член по минимальной позиции (default role)
    const memberRole = await this.rolesRepo.createQueryBuilder('r')
      .where('r.guildId = :guildId', { guildId: guild.id })
      .orderBy('r.position', 'ASC')
      .getOne();

    const status = guild.requiresApproval ? MemberStatus.PENDING : MemberStatus.ACTIVE;
    const member = this.membersRepo.create({ userId: user.id, guildId: guild.id, status });
    if (memberRole) member.roles = [memberRole];
    return this.membersRepo.save(member);
  }

  async regenerateInviteCode(guildId: string, user: User): Promise<{ inviteCode: string }> {
    await this.requirePermission(guildId, user.id, Permission.CREATE_INVITE);
    const newCode = nanoid(10);
    await this.guildsRepo.update(guildId, { inviteCode: newCode });
    return { inviteCode: newCode };
  }

  // ─── Участники ────────────────────────────────────────────────────────────

  async getMembers(guildId: string, user: User): Promise<GuildMember[]> {
    await this.getMemberOrThrow(guildId, user.id);
    return this.membersRepo.find({
      where: { guildId, status: MemberStatus.ACTIVE },
      relations: ['user', 'roles'],
      select: {
        id: true, nickname: true, status: true, joinedAt: true,
        user: { id: true, username: true, avatar: true, status: true },
      },
    });
  }

  async kickMember(guildId: string, targetUserId: string, user: User): Promise<void> {
    await this.requirePermission(guildId, user.id, Permission.KICK_MEMBERS);
    const guild = await this.guildsRepo.findOne({ where: { id: guildId } });
    if (guild.ownerId === targetUserId) throw new ForbiddenException('Cannot kick the owner');
    await this.membersRepo.delete({ guildId, userId: targetUserId });
  }

  async banMember(guildId: string, targetUserId: string, user: User): Promise<void> {
    await this.requirePermission(guildId, user.id, Permission.BAN_MEMBERS);
    const guild = await this.guildsRepo.findOne({ where: { id: guildId } });
    if (guild.ownerId === targetUserId) throw new ForbiddenException('Cannot ban the owner');
    await this.membersRepo.update({ guildId, userId: targetUserId }, { status: MemberStatus.BANNED });
  }

  async assignRole(guildId: string, targetUserId: string, roleId: string, user: User): Promise<void> {
    await this.requirePermission(guildId, user.id, Permission.MANAGE_ROLES);

    const role = await this.rolesRepo.findOne({ where: { id: roleId, guildId } });
    if (!role) throw new NotFoundException('Role not found');

    const member = await this.getMemberOrThrow(guildId, targetUserId);
    if (!member.roles) member.roles = [];
    if (!member.roles.find(r => r.id === roleId)) {
      member.roles.push(role);
      await this.membersRepo.save(member);
    }
  }

  async removeRole(guildId: string, targetUserId: string, roleId: string, user: User): Promise<void> {
    await this.requirePermission(guildId, user.id, Permission.MANAGE_ROLES);
    const member = await this.getMemberOrThrow(guildId, targetUserId);
    member.roles = member.roles?.filter(r => r.id !== roleId) ?? [];
    await this.membersRepo.save(member);
  }

  // ─── Роли ─────────────────────────────────────────────────────────────────

  async getRoles(guildId: string, user: User): Promise<GuildRole[]> {
    await this.getMemberOrThrow(guildId, user.id);
    return this.rolesRepo.find({
      where: { guildId },
      order: { position: 'DESC' },
    });
  }

  async createRole(guildId: string, dto: CreateRoleDto, user: User): Promise<GuildRole> {
    await this.requirePermission(guildId, user.id, Permission.MANAGE_ROLES);
    const role = this.rolesRepo.create({ ...dto, guildId });
    return this.rolesRepo.save(role);
  }

  async updateRole(guildId: string, roleId: string, dto: Partial<CreateRoleDto>, user: User): Promise<GuildRole> {
    await this.requirePermission(guildId, user.id, Permission.MANAGE_ROLES);
    const role = await this.rolesRepo.findOne({ where: { id: roleId, guildId } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isManaged) throw new ForbiddenException('Cannot modify system roles');
    await this.rolesRepo.update(roleId, dto);
    return this.rolesRepo.findOne({ where: { id: roleId } });
  }

  async deleteRole(guildId: string, roleId: string, user: User): Promise<void> {
    await this.requirePermission(guildId, user.id, Permission.MANAGE_ROLES);
    const role = await this.rolesRepo.findOne({ where: { id: roleId, guildId } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isManaged) throw new ForbiddenException('Cannot delete system roles');
    await this.rolesRepo.delete(roleId);
  }

  // ─── Категории ────────────────────────────────────────────────────────────

  async createCategory(guildId: string, dto: CreateCategoryDto, user: User): Promise<ChannelCategory> {
    await this.requirePermission(guildId, user.id, Permission.MANAGE_CHANNELS);
    const category = this.categoriesRepo.create({ ...dto, guildId });
    return this.categoriesRepo.save(category);
  }

  async deleteCategory(guildId: string, categoryId: string, user: User): Promise<void> {
    await this.requirePermission(guildId, user.id, Permission.MANAGE_CHANNELS);
    // Каналы категории не удаляются — переходят в "без категории"
    await this.channelsRepo.update({ categoryId }, { categoryId: null });
    await this.categoriesRepo.delete({ id: categoryId, guildId });
  }

  // ─── Каналы гильдии ───────────────────────────────────────────────────────

  async createChannel(guildId: string, dto: CreateGuildChannelDto, user: User): Promise<Channel> {
    await this.requirePermission(guildId, user.id, Permission.MANAGE_CHANNELS);

    if (dto.categoryId) {
      const cat = await this.categoriesRepo.findOne({ where: { id: dto.categoryId, guildId } });
      if (!cat) throw new NotFoundException('Category not found in this guild');
    }

    const channel = this.channelsRepo.create({
      ...dto,
      guildId,
      createdById: user.id,
    });
    return this.channelsRepo.save(channel);
  }

  async getChannels(guildId: string, user: User) {
    // Ensure membership and return categories with channels to match frontend
    await this.getMemberOrThrow(guildId, user.id);
    const guild = await this.guildsRepo.findOne({
      where: { id: guildId },
      relations: ['categories', 'categories.channels'],
    });
    if (!guild) throw new NotFoundException('Guild not found');

    guild.categories?.sort((a, b) => a.position - b.position);
    guild.categories?.forEach(cat => cat.channels?.sort((a, b) => a.position - b.position));

    return guild.categories || [];
  }

  // ─── Приватные хелперы ────────────────────────────────────────────────────

  private async getMemberOrThrow(guildId: string, userId: string): Promise<GuildMember> {
    const member = await this.membersRepo.findOne({
      where: { guildId, userId, status: MemberStatus.ACTIVE },
      relations: ['roles'],
    });
    if (!member) throw new ForbiddenException('Not a member of this guild');
    return member;
  }

  private async requirePermission(guildId: string, userId: string, permission: Permission): Promise<void> {
    // Single query: check owner or member permissions
    const result = await this.guildsRepo.createQueryBuilder('g')
      .leftJoinAndSelect('g.members', 'm', 'm.userId = :userId', { userId })
      .leftJoinAndSelect('m.roles', 'r')
      .where('g.id = :guildId', { guildId })
      .select(['g.ownerId', 'm.id'])
      .getRawOne();

    if (!result) throw new NotFoundException('Guild not found');
    if (result.g_ownerId === userId) return;

    // fallback to member permission check
    const member = await this.getMemberOrThrow(guildId, userId);
    if (!member.hasPermission(permission)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}
