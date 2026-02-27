import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Guild } from './guild.entity';

/**
 * Битовые флаги разрешений — можно комбинировать через OR.
 * Хранятся как число в БД, проверяются через битовые операции.
 */
export enum Permission {
  // Общие
  VIEW_CHANNELS      = 1 << 0,   // 1
  MANAGE_CHANNELS    = 1 << 1,   // 2
  MANAGE_GUILD       = 1 << 2,   // 4
  MANAGE_ROLES       = 1 << 3,   // 8
  KICK_MEMBERS       = 1 << 4,   // 16
  BAN_MEMBERS        = 1 << 5,   // 32
  CREATE_INVITE      = 1 << 6,   // 64
  // Текстовые каналы
  SEND_MESSAGES      = 1 << 7,   // 128
  DELETE_MESSAGES    = 1 << 8,   // 256
  PIN_MESSAGES       = 1 << 9,   // 512
  MENTION_EVERYONE   = 1 << 10,  // 1024
  // Голосовые каналы
  CONNECT_VOICE      = 1 << 11,  // 2048
  SPEAK              = 1 << 12,  // 4096
  MUTE_MEMBERS       = 1 << 13,  // 8192
  DEAFEN_MEMBERS     = 1 << 14,  // 16384
  MOVE_MEMBERS       = 1 << 15,  // 32768
  // Стримы
  STREAM             = 1 << 16,  // 65536
  // Администратор — все права
  ADMINISTRATOR      = 1 << 30,
}

/** Готовые наборы прав для быстрого назначения */
export const DEFAULT_PERMISSIONS = {
  MEMBER:    Permission.VIEW_CHANNELS | Permission.SEND_MESSAGES | Permission.CONNECT_VOICE | Permission.SPEAK,
  MODERATOR: Permission.VIEW_CHANNELS | Permission.SEND_MESSAGES | Permission.DELETE_MESSAGES |
             Permission.PIN_MESSAGES | Permission.KICK_MEMBERS | Permission.MUTE_MEMBERS |
             Permission.CONNECT_VOICE | Permission.SPEAK | Permission.CREATE_INVITE,
  OFFICER:   Permission.VIEW_CHANNELS | Permission.SEND_MESSAGES | Permission.DELETE_MESSAGES |
             Permission.PIN_MESSAGES | Permission.KICK_MEMBERS | Permission.BAN_MEMBERS |
             Permission.MANAGE_CHANNELS | Permission.MUTE_MEMBERS | Permission.DEAFEN_MEMBERS |
             Permission.MOVE_MEMBERS | Permission.CONNECT_VOICE | Permission.SPEAK |
             Permission.CREATE_INVITE | Permission.MENTION_EVERYONE | Permission.STREAM,
  OWNER:     Permission.ADMINISTRATOR,
};

@Entity('guild_roles')
export class GuildRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  /** HEX цвет роли для отображения в UI */
  @Column({ default: '#99aab5' })
  color: string;

  /** Битовая маска прав */
  @Column({ type: 'bigint', default: DEFAULT_PERMISSIONS.MEMBER })
  permissions: number;

  /** Порядок в иерархии — чем выше, тем больше прав */
  @Column({ default: 0 })
  position: number;

  /** Показывать участников с этой ролью отдельно в списке */
  @Column({ default: false })
  isHoisted: boolean;

  /** Роль нельзя удалить/изменить (системная) */
  @Column({ default: false })
  isManaged: boolean;

  @Column({ nullable: true })
  guildId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ─── Relations ─────────────────────────────────────────────────────────

  @ManyToOne(() => Guild, guild => guild.roles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'guildId' })
  guild: Guild;

  // ─── Хелпер ────────────────────────────────────────────────────────────

  hasPermission(permission: Permission): boolean {
    if (this.permissions & Permission.ADMINISTRATOR) return true;
    return !!(this.permissions & permission);
  }
}
