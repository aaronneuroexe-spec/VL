import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';
import { Channel } from '../../channels/entities/channel.entity';
import { Message } from '../../messages/entities/message.entity';
import { Event } from '../../events/entities/event.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ default: 'member' })
  role: string;

  @Column({ default: 'offline' })
  status: string;

  @Column({ nullable: true })
  lastSeen: Date;

  @Column({ type: 'jsonb', nullable: true })
  preferences: any;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ─── Relations ─────────────────────────────────────────────────────────

  @OneToMany(() => Channel, channel => channel.createdBy)
  createdChannels: Channel[];

  @OneToMany(() => Message, message => message.author)
  messages: Message[];

  @OneToMany(() => Event, event => event.createdBy)
  createdEvents: Event[];

  // String ref — разрываем circular: user -> guild-member -> guild -> user
  @OneToMany('GuildMember', 'user')
  guildMemberships: any[];
}
