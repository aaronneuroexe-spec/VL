import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateInviteDto {
  @ApiProperty({ description: 'Channel ID for the invite', required: false })
  @IsOptional()
  @IsUUID()
  channelId?: string;

  @ApiProperty({ description: 'Role for the invited user', default: 'member' })
  @IsOptional()
  @IsString()
  role?: string = 'member';

  @ApiProperty({ description: 'Expiration time in hours', default: 24 })
  @IsOptional()
  expiresInHours?: number = 24;
}
