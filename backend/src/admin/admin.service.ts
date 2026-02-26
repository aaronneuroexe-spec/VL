import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Channel } from '../channels/entities/channel.entity';
import { Message } from '../messages/entities/message.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Channel)
    private channelsRepository: Repository<Channel>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
  ) {}

  async getSystemStats(): Promise<any> {
    const [userCount, channelCount, messageCount] = await Promise.all([
      this.usersRepository.count(),
      this.channelsRepository.count(),
      this.messagesRepository.count(),
    ]);

    return {
      users: userCount,
      channels: channelCount,
      messages: messageCount,
      timestamp: new Date(),
    };
  }

  async banUser(userId: string, adminUser: User, reason: string): Promise<void> {
    if (adminUser.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    await this.usersRepository.update(userId, {
      role: 'banned',
      metadata: {
        bannedBy: adminUser.id,
        bannedAt: new Date(),
        reason,
      } as any,
    });
  }

  async unbanUser(userId: string, adminUser: User): Promise<void> {
    if (adminUser.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    await this.usersRepository.update(userId, {
      role: 'member',
      metadata: {
        unbannedBy: adminUser.id,
        unbannedAt: new Date(),
      } as any,
    });
  }

  async deleteChannel(channelId: string, adminUser: User): Promise<void> {
    if (adminUser.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    await this.channelsRepository.delete(channelId);
  }

  async deleteMessage(messageId: string, adminUser: User): Promise<void> {
    if (adminUser.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    await this.messagesRepository.update(messageId, {
      isDeleted: true,
      content: '[Message deleted by admin]',
    });
  }

  async getUserActivity(userId: string, adminUser: User): Promise<any> {
    if (adminUser.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    const [messages, channels] = await Promise.all([
      this.messagesRepository.find({
        where: { authorId: userId },
        order: { createdAt: 'DESC' },
        take: 50,
      }),
      this.channelsRepository.find({
        where: { createdById: userId },
      }),
    ]);

    return {
      userId,
      messageCount: messages.length,
      channelCount: channels.length,
      recentMessages: messages,
      createdChannels: channels,
    };
  }
}
