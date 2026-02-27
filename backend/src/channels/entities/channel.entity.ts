import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Message } from '../../messages/entities/message.entity';
import { Event } from '../../events/entities/event.entity';
import { Guild } from '../../guilds/entities/guild.entity';
import { ChannelCategory } from '../../guilds/entities/channel-category.entity';

export enum ChannelType {
  TEXT   = 'text',
  VOICE  = 'voice',
  STREAM = 'stream',
}

@Entity('channels')
export class Channel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: ChannelType, default: ChannelType.TEXT })
  type: ChannelType;

  @Column({ nullable: true })
  topic: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: false })
  isPrivate: boolean;

  /** Битовая маска прав доступа к каналу (переопределяет роли гильдии) */
  @Column({ type: 'jsonb', nullable: true })
  permissionOverwrites: Array<{
    roleId: string;
    allow: number;
    deny: number;
  }>;

  @Column({ default: 0 })
  position: number;

  @Column({ default: 0 })
  memberCount: number;

  @Column({ nullable: true })
  guildId: string;

  @Column({ nullable: true })
  categoryId: string;

  @Column({ nullable: true })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ─── Relations ─────────────────────────────────────────────────────────

  @ManyToOne(() => Guild, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'guildId' })
  guild: Guild;

  @ManyToOne(() => ChannelCategory, category => category.channels, { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category: ChannelCategory;

  @ManyToOne(() => User, user => user.createdChannels)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @OneToMany(() => Message, message => message.channel)
  messages: Message[];

  @OneToMany(() => Event, event => event.channel)
  events: Event[];
}
