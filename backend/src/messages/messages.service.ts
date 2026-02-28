import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { User } from '../users/entities/user.entity';
import { Channel } from '../channels/entities/channel.entity';
import { ChannelsService } from '../channels/channels.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    private channelsService: ChannelsService,
  ) {}

  async create(createMessageDto: Partial<Message>, user: User, channelId: string): Promise<Message> {
    const message = this.messagesRepository.create({
      ...createMessageDto,
      authorId: user.id,
      channelId,
      author: user,
    });
    return this.messagesRepository.save(message);
  }

  async findAll(channelId: string, user: User, limit: number = 50, offset: number = 0): Promise<Message[]> {
    // Authorization: ensure user has access to channel
    const channel = await this.channelsService.findOne(channelId, user);
    if (channel.isPrivate && (!user || channel.createdById !== user.id)) {
      throw new ForbiddenException('Access denied to channel messages');
    }
    return this.messagesRepository.find({
      where: { 
        channelId,
        isDeleted: false,
      },
      relations: ['author', 'replyTo'],
      select: {
        id: true,
        content: true,
        attachments: true,
        metadata: true,
        replyToId: true,
        editedAt: true,
        createdAt: true,
        author: {
          id: true,
          username: true,
          avatar: true,
        },
        replyTo: {
          id: true,
          content: true,
          author: {
            id: true,
            username: true,
          },
        },
      },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async findOne(id: string, user: User): Promise<Message> {
    const message = await this.messagesRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['author', 'channel', 'replyTo'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return message;
  }

  async update(id: string, updateMessageDto: Partial<Message>, user: User): Promise<Message> {
    const message = await this.findOne(id, user);

    // Check if user is the author
    if (message.authorId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('Only message author or admin can edit message');
    }

    await this.messagesRepository.update(id, {
      ...updateMessageDto,
      editedAt: new Date(),
    });

    return this.findOne(id, user);
  }

  async remove(id: string, user: User): Promise<void> {
    const message = await this.findOne(id, user);

    // Check if user is the author or admin
    if (message.authorId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('Only message author or admin can delete message');
    }

    // Soft delete
    await this.messagesRepository.update(id, { 
      isDeleted: true,
      content: '[Message deleted]',
      attachments: null,
    });
  }

  async search(query: string, channelId: string, user: User): Promise<Message[]> {
    return this.messagesRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.author', 'author')
      .where('message.content ILIKE :query', { query: `%${query}%` })
      .andWhere('message.channelId = :channelId', { channelId })
      .andWhere('message.isDeleted = :isDeleted', { isDeleted: false })
      .select([
        'message.id',
        'message.content',
        'message.attachments',
        'message.createdAt',
        'author.id',
        'author.username',
        'author.avatar',
      ])
      .orderBy('message.createdAt', 'DESC')
      .getMany();
  }
}
