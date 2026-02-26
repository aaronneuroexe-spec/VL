import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Message } from '../../messages/entities/message.entity';
import { Event } from '../../events/entities/event.entity';

export enum ChannelType {
  TEXT = 'text',
  VOICE = 'voice',
  STREAM = 'stream',
}

@Entity('channels')
export class Channel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ChannelType,
    default: ChannelType.TEXT,
  })
  type: ChannelType;

  @Column({ nullable: true })
  topic: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: false })
  isPrivate: boolean;

  @Column({ type: 'jsonb', nullable: true })
  permissions: any;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ default: 0 })
  memberCount: number;

  @Column({ nullable: true })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.createdChannels)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @OneToMany(() => Message, message => message.channel)
  messages: Message[];

  @OneToMany(() => Event, event => event.channel)
  events: Event[];
}
