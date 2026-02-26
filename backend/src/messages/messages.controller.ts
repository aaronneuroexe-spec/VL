import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@ApiTags('Messages')
@Controller('channels/:channelId/messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Send a message to channel' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  create(
    @Param('channelId') channelId: string,
    @Body() createMessageDto: CreateMessageDto,
    @Request() req: RequestWithUser
  ) {
    return this.messagesService.create(createMessageDto, req.user, channelId);
  }

  @Get()
  @ApiOperation({ summary: 'Get channel messages' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  findAll(
    @Param('channelId') channelId: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
    @Request() req: RequestWithUser
  ) {
    return this.messagesService.findAll(channelId, req.user, limit, offset);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search messages in channel' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  search(
    @Param('channelId') channelId: string,
    @Query('q') query: string,
    @Request() req: RequestWithUser
  ) {
    return this.messagesService.search(query, channelId, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get message by ID' })
  @ApiResponse({ status: 200, description: 'Message retrieved successfully' })
  findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.messagesService.findOne(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update message' })
  @ApiResponse({ status: 200, description: 'Message updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @Request() req: RequestWithUser
  ) {
    return this.messagesService.update(id, updateMessageDto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete message' })
  @ApiResponse({ status: 200, description: 'Message deleted successfully' })
  remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.messagesService.remove(id, req.user);
  }
}
