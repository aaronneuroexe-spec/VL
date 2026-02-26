import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Event } from './entities/event.entity';
import { User } from '../users/entities/user.entity';
import { Channel } from '../channels/entities/channel.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
  ) {}

  async create(createEventDto: Partial<Event>, user: User, channelId?: string): Promise<Event> {
    const event = this.eventsRepository.create({
      ...createEventDto,
      createdById: user.id,
      createdBy: user,
      channelId,
    });
    return this.eventsRepository.save(event);
  }

  async findAll(user: User, channelId?: string): Promise<Event[]> {
    const where: any = {};
    
    if (channelId) {
      where.channelId = channelId;
    }

    return this.eventsRepository.find({
      where,
      relations: ['createdBy', 'channel'],
      select: {
        id: true,
        title: true,
        description: true,
        startsAt: true,
        endsAt: true,
        metadata: true,
        isRecurring: true,
        createdAt: true,
        createdBy: {
          id: true,
          username: true,
          avatar: true,
        },
        channel: {
          id: true,
          name: true,
        },
      },
      order: { startsAt: 'ASC' },
    });
  }

  async findOne(id: string, user: User): Promise<Event> {
    const event = await this.eventsRepository.findOne({
      where: { id },
      relations: ['createdBy', 'channel'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async update(id: string, updateEventDto: Partial<Event>, user: User): Promise<Event> {
    const event = await this.findOne(id, user);

    // Check if user is the creator or has admin rights
    if (event.createdById !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('Only event creator or admin can update event');
    }

    await this.eventsRepository.update(id, updateEventDto);
    return this.findOne(id, user);
  }

  async remove(id: string, user: User): Promise<void> {
    const event = await this.findOne(id, user);

    // Check if user is the creator or has admin rights
    if (event.createdById !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('Only event creator or admin can delete event');
    }

    const result = await this.eventsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Event not found');
    }
  }

  async findUpcoming(user: User, days: number = 7): Promise<Event[]> {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);

    return this.eventsRepository.find({
      where: {
        startsAt: Between(now, future),
      },
      relations: ['createdBy', 'channel'],
      order: { startsAt: 'ASC' },
    });
  }

  async findByDateRange(user: User, startDate: Date, endDate: Date): Promise<Event[]> {
    return this.eventsRepository.find({
      where: {
        startsAt: Between(startDate, endDate),
      },
      relations: ['createdBy', 'channel'],
      order: { startsAt: 'ASC' },
    });
  }
}
