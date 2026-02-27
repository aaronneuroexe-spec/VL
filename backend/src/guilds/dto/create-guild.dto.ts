import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, MaxLength, MinLength } from 'class-validator';

export class CreateGuildDto {
  @ApiProperty({ description: 'Название гильдии' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ required: false, description: 'Публичная гильдия (видна в каталоге)' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({ required: false, description: 'Требовать одобрения при вступлении' })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;
}
