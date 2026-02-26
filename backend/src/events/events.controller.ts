import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@ApiTags('Events')
@Controller('events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  create(
    @Body() createEventDto: CreateEventDto,
    @Request() req: RequestWithUser
  ) {
    const payload = {
      ...createEventDto,
      startsAt: new Date(createEventDto.startsAt),
      endsAt: createEventDto.endsAt ? new Date(createEventDto.endsAt) : undefined,
    };
    return this.eventsService.create(payload, req.user, createEventDto.channelId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all events' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  findAll(
    @Query('channelId') channelId: string,
    @Request() req: RequestWithUser
  ) {
    return this.eventsService.findAll(req.user, channelId);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming events' })
  @ApiResponse({ status: 200, description: 'Upcoming events retrieved successfully' })
  findUpcoming(
    @Query('days') days: number = 7,
    @Request() req: RequestWithUser
  ) {
    return this.eventsService.findUpcoming(req.user, days);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiResponse({ status: 200, description: 'Event retrieved successfully' })
  findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.eventsService.findOne(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update event' })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Request() req: RequestWithUser
  ) {
    const payload = {
      ...updateEventDto,
      ...(updateEventDto.startsAt && { startsAt: new Date(updateEventDto.startsAt) }),
      ...(updateEventDto.endsAt && { endsAt: new Date(updateEventDto.endsAt) }),
    };
    return this.eventsService.update(id, payload, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete event' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.eventsService.remove(id, req.user);
  }
}
