import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Channel } from '../../channels/entities/channel.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  attachments: any[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ nullable: true })
  replyToId: string;

  @Column({ nullable: true })
  editedAt: Date;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ nullable: true })
  channelId: string;

  @Column({ nullable: true })
  authorId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Channel, channel => channel.messages)
  @JoinColumn({ name: 'channelId' })
  channel: Channel;

  @ManyToOne(() => User, user => user.messages)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @ManyToOne(() => Message, message => message.id, { nullable: true })
  @JoinColumn({ name: 'replyToId' })
  replyTo: Message;
}
