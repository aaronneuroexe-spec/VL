import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { User } from '../users/entities/user.entity';
import { Channel } from '../channels/entities/channel.entity';
import { Message } from '../messages/entities/message.entity';

@Module({
  imports: [
    PrometheusModule.register(),
    TypeOrmModule.forFeature([User, Channel, Message]),
  ],
  controllers: [MonitoringController],
  providers: [MonitoringService],
  exports: [MonitoringService],
})
export class MonitoringModule {}
