import { Module, Global, Logger, Injectable } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule, InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

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

@Injectable()
export class RedisMonitor {
  private readonly logger = new Logger(RedisMonitor.name);

  constructor(@InjectRedis() private readonly redis: Redis) {
    try {
      this.redis.on('connect', () => this.logger.log('Redis client connecting'));
      this.redis.on('ready', () => this.logger.log('Redis client ready'));
      this.redis.on('error', (err: Error) => this.logger.error('Redis error', err));
      this.redis.on('close', () => this.logger.warn('Redis connection closed'));
    } catch (e) {
      this.logger.error('Failed to attach Redis event listeners', e as any);
    }
  }
}
