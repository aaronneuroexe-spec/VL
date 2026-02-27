import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuildsController } from './guilds.controller';
import { GuildsService } from './guilds.service';
import { Guild } from './entities/guild.entity';
import { GuildMember } from './entities/guild-member.entity';
import { GuildRole } from './entities/guild-role.entity';
import { ChannelCategory } from './entities/channel-category.entity';
import { Channel } from '../channels/entities/channel.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Guild, GuildMember, GuildRole, ChannelCategory, Channel]),
    AuthModule,
  ],
  controllers: [GuildsController],
  providers: [GuildsService],
  exports: [GuildsService],
})
export class GuildsModule {}
