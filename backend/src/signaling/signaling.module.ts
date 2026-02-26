import { Module } from '@nestjs/common';
import { SignalingController } from './signaling.controller';
import { SignalingService } from './signaling.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SignalingController],
  providers: [SignalingService],
  exports: [SignalingService],
})
export class SignalingModule {}
