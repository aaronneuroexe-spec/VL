import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'Username' })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ description: 'Email address', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Password', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({ description: 'User role', default: 'member' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({ description: 'Avatar URL', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;
}
