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
import { DatabaseConfig } from './config/database.config';
import { RedisConfig } from './config/redis.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),

    // Redis
    RedisConfig,

    // Event emitter (for plugins, etc.)
    EventEmitterModule.forRoot(),

    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    }]),

    // Feature modules
    AuthModule,
    UsersModule,
    ChannelsModule,
    MessagesModule,
    WebsocketModule,
    SignalingModule,
    MediaModule,
    EventsModule,
    AdminModule,
    MonitoringModule,
  ],
})
export class AppModule {}
