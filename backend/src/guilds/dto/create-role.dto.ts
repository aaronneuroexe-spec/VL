import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, MaxLength, Matches } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ description: 'Название роли' })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({ required: false, description: 'HEX цвет роли', example: '#e74c3c' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'color must be a valid hex color' })
  color?: string;

  @ApiProperty({ required: false, description: 'Битовая маска прав' })
  @IsOptional()
  @IsNumber()
  permissions?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isHoisted?: boolean;
}
