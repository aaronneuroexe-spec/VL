import { Controller, Post, Body, Get, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LiveKitService } from './livekit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChannelsService } from '../channels/channels.service';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@ApiTags('LiveKit')
@Controller('livekit')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LivekitController {
  constructor(
    private readonly livekitService: LiveKitService,
    private readonly channelsService: ChannelsService,
  ) {}

  /**
   * Получить токен для голосового канала.
   * Identity берётся из JWT — нельзя запросить чужой токен.
   */
  @Post('token')
  @ApiOperation({ summary: 'Get LiveKit token for a voice channel' })
  @ApiResponse({ status: 200, description: 'Token generated' })
  @ApiResponse({ status: 403, description: 'No access to channel' })
  async getToken(
    @Request() req: RequestWithUser,
    @Body() body: { channelId: string },
  ) {
    const user = req.user;

    // Проверяем что канал существует и пользователь имеет доступ
    const channel = await this.channelsService.findOne(body.channelId, user);

    if (channel.type !== 'voice') {
      throw new ForbiddenException('Channel is not a voice channel');
    }

    const roomName = this.livekitService.roomName(body.channelId);
    return this.livekitService.createToken(roomName, user.id, {});
  }

  /**
   * Список участников в голосовом канале.
   */
  @Get('participants/:channelId')
  @ApiOperation({ summary: 'Get voice channel participants' })
  async getParticipants(@Param('channelId') channelId: string) {
    const roomName = this.livekitService.roomName(channelId);
    const participants = await this.livekitService.getParticipants(roomName);
    return participants.map((p) => ({
      identity: p.identity,
      joinedAt: p.joinedAt,
    }));
  }
}

