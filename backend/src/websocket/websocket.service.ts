import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

@Injectable()
export class WebsocketService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async getChannelMembers(channelId: string): Promise<any[]> {
    try {
      const members = await this.redis.smembers(`channel:${channelId}:members`);
      return members.map(memberId => ({ id: memberId }));
    } catch (e) {
      // On Redis error return empty members list to allow graceful degradation
      return [];
    }
  }

  async addChannelMember(channelId: string, userId: string): Promise<void> {
    try {
      await this.redis.sadd(`channel:${channelId}:members`, userId);
    } catch (e) {
      // Log and swallow to avoid breaking connection flow
    }
  }

  async removeChannelMember(channelId: string, userId: string): Promise<void> {
    try {
      await this.redis.srem(`channel:${channelId}:members`, userId);
    } catch (e) {
      // Log and swallow
    }
  }

  async getUserChannels(userId: string): Promise<string[]> {
    // Get all channels user is member of
    const pattern = `channel:*:members`;
    try {
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
    } catch (e) {
      return [];
    }
  }

  async setUserPresence(userId: string, status: string): Promise<void> {
    try {
      await this.redis.set(`user:${userId}:status`, status, 'EX', 300); // 5 minutes TTL
    } catch (e) {
      // swallow errors
    }
  }

  async getUserPresence(userId: string): Promise<string> {
    try {
      return (await this.redis.get(`user:${userId}:status`)) || 'offline';
    } catch (e) {
      return 'offline';
    }
  }

  async getAllOnlineUsers(): Promise<string[]> {
    const pattern = `user:*:status`;
    try {
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
    } catch (e) {
      return [];
    }
  }

  async storeSignalingData(from: string, to: string, data: any): Promise<void> {
    try {
      const key = `signaling:${from}:${to}`;
      await this.redis.set(key, JSON.stringify(data), 'EX', 300); // 5 minutes TTL
    } catch (e) {
      // swallow
    }
  }

  async getSignalingData(from: string, to: string): Promise<any> {
    try {
      const key = `signaling:${from}:${to}`;
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  async clearSignalingData(from: string, to: string): Promise<void> {
    try {
      const key = `signaling:${from}:${to}`;
      await this.redis.del(key);
    } catch (e) {
      // swallow
    }
  }

  async removeChannelMemberFromAll(userId: string): Promise<void> {
    try {
      const pattern = `channel:*:members`;
      const keys = await this.redis.keys(pattern);
      for (const key of keys) {
        await this.redis.srem(key, userId);
      }
    } catch (e) {
      // swallow
    }
  }
}
