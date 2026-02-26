import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsBoolean, IsUUID } from 'class-validator';

export class CreateEventDto {
  @ApiProperty({ description: 'Event title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Event description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Event start time' })
  @IsDateString()
  startsAt: string;

  @ApiProperty({ description: 'Event end time', required: false })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiProperty({ description: 'Channel ID for the event', required: false })
  @IsOptional()
  @IsUUID()
  channelId?: string;

  @ApiProperty({ description: 'Is recurring event', default: false })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiProperty({ description: 'Event metadata', required: false })
  @IsOptional()
  metadata?: any;
}
