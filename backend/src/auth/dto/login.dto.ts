import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Username', required: false })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ description: 'Email', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Invite token', required: false })
  @IsOptional()
  @IsString()
  inviteToken?: string;
}
