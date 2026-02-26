import { Controller, Get, Post, Delete, UseGuards, Param, Body, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get system statistics (admin only)' })
  @ApiResponse({ status: 200, description: 'System statistics retrieved successfully' })
  getStats(@Request() req: RequestWithUser) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.adminService.getSystemStats();
  }

  @Post('ban/:userId')
  @ApiOperation({ summary: 'Ban user (admin only)' })
  @ApiResponse({ status: 200, description: 'User banned successfully' })
  banUser(
    @Param('userId') userId: string,
    @Body() body: { reason: string },
    @Request() req: RequestWithUser
  ) {
    return this.adminService.banUser(userId, req.user, body.reason);
  }

  @Post('unban/:userId')
  @ApiOperation({ summary: 'Unban user (admin only)' })
  @ApiResponse({ status: 200, description: 'User unbanned successfully' })
  unbanUser(@Param('userId') userId: string, @Request() req: RequestWithUser) {
    return this.adminService.unbanUser(userId, req.user);
  }

  @Delete('channels/:channelId')
  @ApiOperation({ summary: 'Delete channel (admin only)' })
  @ApiResponse({ status: 200, description: 'Channel deleted successfully' })
  deleteChannel(@Param('channelId') channelId: string, @Request() req: RequestWithUser) {
    return this.adminService.deleteChannel(channelId, req.user);
  }

  @Delete('messages/:messageId')
  @ApiOperation({ summary: 'Delete message (admin only)' })
  @ApiResponse({ status: 200, description: 'Message deleted successfully' })
  deleteMessage(@Param('messageId') messageId: string, @Request() req: RequestWithUser) {
    return this.adminService.deleteMessage(messageId, req.user);
  }

  @Get('users/:userId/activity')
  @ApiOperation({ summary: 'Get user activity (admin only)' })
  @ApiResponse({ status: 200, description: 'User activity retrieved successfully' })
  getUserActivity(@Param('userId') userId: string, @Request() req: RequestWithUser) {
    return this.adminService.getUserActivity(userId, req.user);
  }
}
