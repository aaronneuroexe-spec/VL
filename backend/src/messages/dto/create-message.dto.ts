import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsUUID } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ description: 'Message content', required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ description: 'Message attachments', required: false })
  @IsOptional()
  @IsArray()
  attachments?: any[];

  @ApiProperty({ description: 'Reply to message ID', required: false })
  @IsOptional()
  @IsUUID()
  replyToId?: string;

  @ApiProperty({ description: 'Message metadata', required: false })
  @IsOptional()
  metadata?: any;
}
