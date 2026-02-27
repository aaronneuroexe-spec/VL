import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { MagicLinkDto } from './dto/magic-link.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new account' })
  @ApiResponse({ status: 201, description: 'Account created, returns JWT' })
  @ApiResponse({ status: 409, description: 'Username or email already taken' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('invite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create invite token (auth required)' })
  async createInvite(@Body() dto: CreateInviteDto) {
    return this.authService.createInvite(dto);
  }

  @Post('magic')
  @ApiOperation({ summary: 'Send magic link to email' })
  @ApiResponse({ status: 200, description: 'Magic link sent' })
  async sendMagicLink(@Body() dto: MagicLinkDto) {
    return this.authService.sendMagicLink(dto.email);
  }

  @Get('verify')
  @ApiOperation({ summary: 'Verify magic link token' })
  @ApiResponse({ status: 200, description: 'Verification successful, returns JWT' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async verifyMagicLink(@Query('token') token: string) {
    return this.authService.verifyMagicLink(token);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with username (+ optional invite token)' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: RequestWithUser) {
    return req.user;
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh JWT token' })
  async refreshToken(@Request() req: RequestWithUser) {
    return this.authService.refreshToken(req.user);
  }
}
