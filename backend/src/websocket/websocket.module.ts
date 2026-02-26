import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { WebsocketService } from './websocket.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ChannelsModule } from '../channels/channels.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [AuthModule, UsersModule, ChannelsModule, MessagesModule],
  providers: [WebsocketGateway, WebsocketService],
  exports: [WebsocketService],
})
export class WebsocketModule {}
