import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ChannelType } from '../entities/channel.entity';

export class CreateChannelDto {
  @ApiProperty({ description: 'Channel name' })
  @IsString()
  name: string;

  @ApiProperty({ 
    description: 'Channel type',
    enum: ChannelType,
    default: ChannelType.TEXT
  })
  @IsEnum(ChannelType)
  type: ChannelType;

  @ApiProperty({ description: 'Channel topic', required: false })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiProperty({ description: 'Channel description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Is private channel', default: false })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiProperty({ description: 'Channel permissions', required: false })
  @IsOptional()
  permissions?: any;
}
