import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

@Injectable()
export class WebsocketService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async getChannelMembers(channelId: string): Promise<any[]> {
    // Get channel members from Redis
    const members = await this.redis.smembers(`channel:${channelId}:members`);
    return members.map(memberId => ({ id: memberId }));
  }

  async addChannelMember(channelId: string, userId: string): Promise<void> {
    await this.redis.sadd(`channel:${channelId}:members`, userId);
  }

  async removeChannelMember(channelId: string, userId: string): Promise<void> {
    await this.redis.srem(`channel:${channelId}:members`, userId);
  }

  async getUserChannels(userId: string): Promise<string[]> {
    // Get all channels user is member of
    const pattern = `channel:*:members`;
    const keys = await this.redis.keys(pattern);
    const userChannels: string[] = [];

    for (const key of keys) {
      const isMember = await this.redis.sismember(key, userId);
      if (isMember) {
        const channelId = key.replace('channel:', '').replace(':members', '');
        userChannels.push(channelId);
      }
    }

    return userChannels;
  }

  async setUserPresence(userId: string, status: string): Promise<void> {
    await this.redis.set(`user:${userId}:status`, status, 'EX', 300); // 5 minutes TTL
  }

  async getUserPresence(userId: string): Promise<string> {
    return await this.redis.get(`user:${userId}:status`) || 'offline';
  }

  async getAllOnlineUsers(): Promise<string[]> {
    const pattern = `user:*:status`;
    const keys = await this.redis.keys(pattern);
    const onlineUsers: string[] = [];

    for (const key of keys) {
      const status = await this.redis.get(key);
      if (status === 'online') {
        const userId = key.replace('user:', '').replace(':status', '');
        onlineUsers.push(userId);
      }
    }

    return onlineUsers;
  }

  async storeSignalingData(from: string, to: string, data: any): Promise<void> {
    const key = `signaling:${from}:${to}`;
    await this.redis.set(key, JSON.stringify(data), 'EX', 300); // 5 minutes TTL
  }

  async getSignalingData(from: string, to: string): Promise<any> {
    const key = `signaling:${from}:${to}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async clearSignalingData(from: string, to: string): Promise<void> {
    const key = `signaling:${from}:${to}`;
    await this.redis.del(key);
  }
}
