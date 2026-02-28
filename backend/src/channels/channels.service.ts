import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel, ChannelType } from './entities/channel.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private channelsRepository: Repository<Channel>,
  ) {}

  async create(createChannelDto: Partial<Channel>, user: User): Promise<Channel> {
    const channel = this.channelsRepository.create({
      ...createChannelDto,
      createdById: user.id,
      createdBy: user,
    });
    return this.channelsRepository.save(channel);
  }

  async findAll(user: User): Promise<Channel[]> {
    // Return public channels and channels user has access to
    return this.channelsRepository.find({
      where: { isPrivate: false },
      relations: ['createdBy'],
      select: {
        id: true,
        name: true,
        type: true,
        topic: true,
        description: true,
        isPrivate: true,
        memberCount: true,
        createdAt: true,
        createdBy: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string, user?: User): Promise<Channel> {
    const channel = await this.channelsRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Check if user has access to private channel
    if (channel.isPrivate && user && channel.createdById !== user.id) {
      throw new ForbiddenException('Access denied to private channel');
    }

    return channel;
  }

  async update(id: string, updateChannelDto: Partial<Channel>, user: User): Promise<Channel> {
    const channel = await this.findOne(id, user);

    // Check if user is the creator or has admin rights
    if (channel.createdById !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('Only channel creator or admin can update channel');
    }

    await this.channelsRepository.update(id, updateChannelDto);
    return this.findOne(id, user);
  }

  async remove(id: string, user: User): Promise<void> {
    const channel = await this.findOne(id, user);

    // Check if user is the creator or has admin rights
    if (channel.createdById !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('Only channel creator or admin can delete channel');
    }

    const result = await this.channelsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Channel not found');
    }
  }

  async updateMemberCount(id: string, delta: number): Promise<void> {
    await this.channelsRepository.increment({ id }, 'memberCount', delta);
  }

  async search(query: string, user: User): Promise<Channel[]> {
    return this.channelsRepository
      .createQueryBuilder('channel')
      .leftJoinAndSelect('channel.createdBy', 'createdBy')
      .where('channel.name ILIKE :query OR channel.topic ILIKE :query', {
        query: `%${query}%`,
      })
      .andWhere('channel.isPrivate = :isPrivate', { isPrivate: false })
      .select([
        'channel.id',
        'channel.name',
        'channel.type',
        'channel.topic',
        'channel.description',
        'channel.memberCount',
        'channel.createdAt',
        'createdBy.id',
        'createdBy.username',
        'createdBy.avatar',
      ])
      .getMany();
  }
}
