import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { MagicLinkDto } from './dto/magic-link.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('invite')
  @ApiOperation({ summary: 'Create invite token' })
  @ApiResponse({ status: 201, description: 'Invite created successfully' })
  async createInvite(@Body() createInviteDto: CreateInviteDto) {
    return this.authService.createInvite(createInviteDto);
  }

  @Post('magic')
  @ApiOperation({ summary: 'Send magic link' })
  @ApiResponse({ status: 200, description: 'Magic link sent successfully' })
  async sendMagicLink(@Body() magicLinkDto: MagicLinkDto) {
    return this.authService.sendMagicLink(magicLinkDto.email);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with invite token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  async getProfile(@Request() req: RequestWithUser) {
    return req.user;
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh JWT token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  async refreshToken(@Request() req: RequestWithUser) {
    return this.authService.refreshToken(req.user);
  }
}
