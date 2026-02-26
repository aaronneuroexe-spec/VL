import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Channel } from '../channels/entities/channel.entity';
import { Message } from '../messages/entities/message.entity';

@Injectable()
export class MonitoringService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Channel)
    private channelsRepository: Repository<Channel>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
  ) {}

  async getHealthStatus(): Promise<any> {
    const checks = {
      database: await this.checkDatabase(),
      timestamp: new Date(),
    };

    const isHealthy = Object.values(checks).every(check => 
      typeof check === 'object' ? check.status === 'ok' : true
    );

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      checks,
    };
  }

  private async checkDatabase(): Promise<any> {
    try {
      await this.usersRepository.count();
      return { status: 'ok', message: 'Database connection successful' };
    } catch (error: any) {
      return { status: 'error', message: error?.message || 'Unknown error' };
    }
  }

  async getMetrics(): Promise<any> {
    const [userCount, channelCount, messageCount, onlineUsers] = await Promise.all([
      this.usersRepository.count(),
      this.channelsRepository.count(),
      this.messagesRepository.count({ where: { isDeleted: false } }),
      this.usersRepository.count({ where: { status: 'online' } }),
    ]);

    return {
      voxlink_users_total: userCount,
      voxlink_channels_total: channelCount,
      voxlink_messages_total: messageCount,
      voxlink_online_users: onlineUsers,
      voxlink_uptime_seconds: process.uptime(),
      voxlink_memory_usage_bytes: process.memoryUsage().heapUsed,
    };
  }

  async getSystemInfo(): Promise<any> {
    return {
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    };
  }
}
