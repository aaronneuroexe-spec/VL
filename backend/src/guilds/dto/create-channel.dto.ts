import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum, IsUUID, MaxLength } from 'class-validator';
import { ChannelType } from '../../channels/entities/channel.entity';

export class CreateGuildChannelDto {
  @ApiProperty({ description: 'Название канала' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: ChannelType, default: ChannelType.TEXT })
  @IsOptional()
  @IsEnum(ChannelType)
  type?: ChannelType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  topic?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiProperty({ required: false, description: 'ID категории' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
