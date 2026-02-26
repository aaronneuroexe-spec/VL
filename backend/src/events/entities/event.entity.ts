import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Channel } from '../../channels/entities/channel.entity';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamptz' })
  startsAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endsAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ default: false })
  isRecurring: boolean;

  @Column({ nullable: true })
  channelId: string;

  @Column({ nullable: true })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Channel, channel => channel.events)
  @JoinColumn({ name: 'channelId' })
  channel: Channel;

  @ManyToOne(() => User, user => user.createdEvents)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;
}
