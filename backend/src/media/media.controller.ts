import { Controller, Post, Get, UseGuards, Request, Body, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@ApiTags('Media')
@Controller('media')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('record')
  @ApiOperation({ summary: 'Start recording (admin only)' })
  @ApiResponse({ status: 201, description: 'Recording started successfully' })
  async startRecording(@Request() req: RequestWithUser, @Body() body: { channelId: string }) {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    
    return this.mediaService.startRecording(body.channelId, req.user.id);
  }

  @Get('config')
  @ApiOperation({ summary: 'Get media configuration' })
  @ApiResponse({ status: 200, description: 'Media configuration retrieved successfully' })
  getConfig() {
    return this.mediaService.getRecordingConfig();
  }
}
