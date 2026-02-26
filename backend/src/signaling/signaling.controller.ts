import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SignalingService } from './signaling.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('WebRTC Signaling')
@Controller('signaling')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SignalingController {
  constructor(private readonly signalingService: SignalingService) {}

  @Get('config')
  @ApiOperation({ summary: 'Get WebRTC configuration' })
  @ApiResponse({ status: 200, description: 'WebRTC configuration retrieved successfully' })
  getWebRTCConfig() {
    return {
      rtcConfiguration: this.signalingService.getWebRTCConfiguration(),
      turnServers: this.signalingService.getTURNServers(),
      stunServers: this.signalingService.getSTUNServers(),
    };
  }
}
