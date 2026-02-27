import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ description: 'Username' })
  @IsString()
  username: string;

  @ApiProperty({ description: 'Email' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Password (min 6 chars)' })
  @IsString()
  @MinLength(6)
  password: string;
}
