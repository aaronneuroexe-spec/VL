import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, ManyToMany, JoinColumn, JoinTable,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Guild } from './guild.entity';
import { GuildRole } from './guild-role.entity';

export enum MemberStatus {
  ACTIVE   = 'active',
  PENDING  = 'pending',   // ожидает одобрения
  BANNED   = 'banned',
}

@Entity('guild_members')
export class GuildMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  nickname: string;

  @Column({
    type: 'enum',
    enum: MemberStatus,
    default: MemberStatus.ACTIVE,
  })
  status: MemberStatus;

  /** Серверный мут офицером */
  @Column({ default: false })
  isMuted: boolean;

  /** Серверный deaf офицером */
  @Column({ default: false })
  isDeafened: boolean;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  guildId: string;

  @CreateDateColumn()
  joinedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ─── Relations ─────────────────────────────────────────────────────────

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Guild, guild => guild.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'guildId' })
  guild: Guild;

  /** Несколько ролей на участника — ManyToMany */
  @ManyToMany(() => GuildRole, { eager: true })
  @JoinTable({
    name: 'guild_member_roles',
    joinColumn: { name: 'memberId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' },
  })
  roles: GuildRole[];

  // ─── Хелпер: проверить право с учётом всех ролей участника ────────────

  hasPermission(permission: number): boolean {
    return this.roles?.some(role => role.hasPermission(permission)) ?? false;
  }
}
