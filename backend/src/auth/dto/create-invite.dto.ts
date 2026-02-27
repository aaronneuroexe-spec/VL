import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsNumber, Min, Max } from 'class-validator';

export class CreateInviteDto {
  @ApiProperty({ description: 'Channel ID for the invite', required: false })
  @IsOptional()
  @IsUUID()
  channelId?: string;

  @ApiProperty({ description: 'Role for the invited user', default: 'member' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({ description: 'Expiration in hours', default: 168 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(720)
  expiresInHours?: number;

  @ApiProperty({ description: 'Max number of uses (0 = unlimited)', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxUses?: number;
}
