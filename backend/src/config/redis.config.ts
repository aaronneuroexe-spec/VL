import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '@nestjs-modules/ioredis';

@Global()
@Module({
  imports: [
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL', 'redis://localhost:6379');
        try {
          // Parse Redis URL
          const url = new URL(redisUrl);
          return {
            type: 'single',
            options: {
              host: url.hostname,
              port: parseInt(url.port) || 6379,
              password: url.password || undefined,
            },
          };
        } catch {
          // Fallback if URL parsing fails
          return {
            type: 'single',
            options: {
              host: 'localhost',
              port: 6379,
            },
          };
        }
      },
      inject: [ConfigService],
    }),
  ],
  exports: [RedisModule],
})
export class RedisConfig {}
