import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

// Намеренно НЕ импортируем GuildMember/GuildRole/ChannelCategory здесь —
// это разрывает circular import. TypeORM резолвит типы через () => EntityClass.

@Entity('guilds')
export class Guild {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ nullable: true })
  banner: string;

  @Column({ unique: true, nullable: true })
  inviteCode: string;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ default: false })
  requiresApproval: boolean;

  @Column({ nullable: true })
  ownerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ─── Relations (lazy type refs — без прямых импортов) ─────────────────────

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @OneToMany('GuildMember', 'guild', { cascade: true })
  members: any[];

  @OneToMany('GuildRole', 'guild', { cascade: true })
  roles: any[];

  @OneToMany('ChannelCategory', 'guild', { cascade: true })
  categories: any[];
}
