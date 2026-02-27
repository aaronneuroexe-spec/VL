import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  UseGuards, Request, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GuildsService } from './guilds.service';
import { CreateGuildDto } from './dto/create-guild.dto';
import { UpdateGuildDto } from './dto/update-guild.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateGuildChannelDto } from './dto/create-channel.dto';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@ApiTags('Guilds')
@Controller('guilds')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GuildsController {
  constructor(private readonly guildsService: GuildsService) {}

  // ─── Гильдии ──────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Создать гильдию' })
  create(@Body() dto: CreateGuildDto, @Request() req: RequestWithUser) {
    return this.guildsService.create(dto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Мои гильдии' })
  findAll(@Request() req: RequestWithUser) {
    return this.guildsService.findAll(req.user);
  }

  @Get(':guildId')
  @ApiOperation({ summary: 'Получить гильдию со структурой каналов' })
  findOne(@Param('guildId') guildId: string, @Request() req: RequestWithUser) {
    return this.guildsService.findOne(guildId, req.user);
  }

  @Patch(':guildId')
  @ApiOperation({ summary: 'Обновить гильдию' })
  update(
    @Param('guildId') guildId: string,
    @Body() dto: UpdateGuildDto,
    @Request() req: RequestWithUser,
  ) {
    return this.guildsService.update(guildId, dto, req.user);
  }

  @Delete(':guildId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить гильдию (только владелец)' })
  delete(@Param('guildId') guildId: string, @Request() req: RequestWithUser) {
    return this.guildsService.delete(guildId, req.user);
  }

  // ─── Инвайты ──────────────────────────────────────────────────────────────

  @Get('join/:inviteCode')
  @ApiOperation({ summary: 'Превью гильдии по инвайт-коду' })
  previewByInvite(@Param('inviteCode') inviteCode: string) {
    return this.guildsService.getByInviteCode(inviteCode);
  }

  @Post('join/:inviteCode')
  @ApiOperation({ summary: 'Вступить в гильдию по инвайт-коду' })
  joinByInvite(@Param('inviteCode') inviteCode: string, @Request() req: RequestWithUser) {
    return this.guildsService.joinByInvite(inviteCode, req.user);
  }

  @Post(':guildId/invite/regenerate')
  @ApiOperation({ summary: 'Перегенерировать инвайт-код' })
  regenerateInvite(@Param('guildId') guildId: string, @Request() req: RequestWithUser) {
    return this.guildsService.regenerateInviteCode(guildId, req.user);
  }

  // ─── Участники ────────────────────────────────────────────────────────────

  @Get(':guildId/members')
  @ApiOperation({ summary: 'Список участников' })
  getMembers(@Param('guildId') guildId: string, @Request() req: RequestWithUser) {
    return this.guildsService.getMembers(guildId, req.user);
  }

  @Delete(':guildId/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Кикнуть участника' })
  kickMember(
    @Param('guildId') guildId: string,
    @Param('userId') userId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.guildsService.kickMember(guildId, userId, req.user);
  }

  @Post(':guildId/members/:userId/ban')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Забанить участника' })
  banMember(
    @Param('guildId') guildId: string,
    @Param('userId') userId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.guildsService.banMember(guildId, userId, req.user);
  }

  @Post(':guildId/members/:userId/roles/:roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Назначить роль участнику' })
  assignRole(
    @Param('guildId') guildId: string,
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.guildsService.assignRole(guildId, userId, roleId, req.user);
  }

  @Delete(':guildId/members/:userId/roles/:roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Снять роль с участника' })
  removeRole(
    @Param('guildId') guildId: string,
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.guildsService.removeRole(guildId, userId, roleId, req.user);
  }

  // ─── Роли ─────────────────────────────────────────────────────────────────

  @Get(':guildId/roles')
  @ApiOperation({ summary: 'Список ролей гильдии' })
  getRoles(@Param('guildId') guildId: string, @Request() req: RequestWithUser) {
    return this.guildsService.getRoles(guildId, req.user);
  }

  @Post(':guildId/roles')
  @ApiOperation({ summary: 'Создать роль' })
  createRole(
    @Param('guildId') guildId: string,
    @Body() dto: CreateRoleDto,
    @Request() req: RequestWithUser,
  ) {
    return this.guildsService.createRole(guildId, dto, req.user);
  }

  @Patch(':guildId/roles/:roleId')
  @ApiOperation({ summary: 'Обновить роль' })
  updateRole(
    @Param('guildId') guildId: string,
    @Param('roleId') roleId: string,
    @Body() dto: CreateRoleDto,
    @Request() req: RequestWithUser,
  ) {
    return this.guildsService.updateRole(guildId, roleId, dto, req.user);
  }

  @Delete(':guildId/roles/:roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить роль' })
  deleteRole(
    @Param('guildId') guildId: string,
    @Param('roleId') roleId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.guildsService.deleteRole(guildId, roleId, req.user);
  }

  // ─── Категории ────────────────────────────────────────────────────────────

  @Post(':guildId/categories')
  @ApiOperation({ summary: 'Создать категорию каналов' })
  createCategory(
    @Param('guildId') guildId: string,
    @Body() dto: CreateCategoryDto,
    @Request() req: RequestWithUser,
  ) {
    return this.guildsService.createCategory(guildId, dto, req.user);
  }

  @Delete(':guildId/categories/:categoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить категорию' })
  deleteCategory(
    @Param('guildId') guildId: string,
    @Param('categoryId') categoryId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.guildsService.deleteCategory(guildId, categoryId, req.user);
  }

  // ─── Каналы гильдии ───────────────────────────────────────────────────────

  @Get(':guildId/channels')
  @ApiOperation({ summary: 'Каналы гильдии' })
  getChannels(@Param('guildId') guildId: string, @Request() req: RequestWithUser) {
    return this.guildsService.getChannels(guildId, req.user);
  }

  @Post(':guildId/channels')
  @ApiOperation({ summary: 'Создать канал в гильдии' })
  createChannel(
    @Param('guildId') guildId: string,
    @Body() dto: CreateGuildChannelDto,
    @Request() req: RequestWithUser,
  ) {
    return this.guildsService.createChannel(guildId, dto, req.user);
  }
}
