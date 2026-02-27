import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChannelsModule } from './channels/channels.module';
import { MessagesModule } from './messages/messages.module';
import { WebsocketModule } from './websocket/websocket.module';
import { SignalingModule } from './signaling/signaling.module';
import { MediaModule } from './media/media.module';
import { EventsModule } from './events/events.module';
import { AdminModule } from './admin/admin.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { GuildsModule } from './guilds/guilds.module';
import { LivekitModule } from './livekit/livekit.module';
import { DatabaseConfig } from './config/database.config';
import { RedisConfig } from './config/redis.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({ useClass: DatabaseConfig }),
    RedisConfig,
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // Feature modules
    AuthModule,
    UsersModule,
    GuildsModule,
    ChannelsModule,
    MessagesModule,
    WebsocketModule,
    SignalingModule,
    MediaModule,
    EventsModule,
    AdminModule,
    MonitoringModule,
    LivekitModule,
  ],
})
export class AppModule {}
