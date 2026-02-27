import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Название категории' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  position?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
