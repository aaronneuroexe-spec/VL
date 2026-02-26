import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@ApiTags('Channels')
@Controller('channels')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new channel' })
  @ApiResponse({ status: 201, description: 'Channel created successfully' })
  create(@Body() createChannelDto: CreateChannelDto, @Request() req: RequestWithUser) {
    return this.channelsService.create(createChannelDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all accessible channels' })
  @ApiResponse({ status: 200, description: 'Channels retrieved successfully' })
  findAll(@Request() req: RequestWithUser) {
    return this.channelsService.findAll(req.user);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search channels' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  search(@Query('q') query: string, @Request() req: RequestWithUser) {
    return this.channelsService.search(query, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get channel by ID' })
  @ApiResponse({ status: 200, description: 'Channel retrieved successfully' })
  findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.channelsService.findOne(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update channel' })
  @ApiResponse({ status: 200, description: 'Channel updated successfully' })
  update(@Param('id') id: string, @Body() updateChannelDto: UpdateChannelDto, @Request() req: RequestWithUser) {
    return this.channelsService.update(id, updateChannelDto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete channel' })
  @ApiResponse({ status: 200, description: 'Channel deleted successfully' })
  remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.channelsService.remove(id, req.user);
  }
}
