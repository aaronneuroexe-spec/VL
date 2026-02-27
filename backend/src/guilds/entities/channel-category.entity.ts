import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Guild } from './guild.entity';

@Entity('channel_categories')
export class ChannelCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: 0 })
  position: number;

  @Column({ default: false })
  isPrivate: boolean;

  @Column({ nullable: true })
  guildId: string;

  // ─── Relations ─────────────────────────────────────────────────────────

  @ManyToOne(() => Guild, 'categories', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'guildId' })
  guild: Guild;

  // Используем string ref чтобы избежать circular import с channel.entity
  @OneToMany('Channel', 'category')
  channels: any[];
}
