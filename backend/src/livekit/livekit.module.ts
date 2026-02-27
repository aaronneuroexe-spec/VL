import { Module } from '@nestjs/common';
import { LivekitController } from './livekit.controller';
import { LiveKitService } from './livekit.service';
import { AuthModule } from '../auth/auth.module';
import { ChannelsModule } from '../channels/channels.module';

@Module({
  imports: [AuthModule, ChannelsModule],
  controllers: [LivekitController],
  providers: [LiveKitService],
  exports: [LiveKitService],
})
export class LivekitModule {}
