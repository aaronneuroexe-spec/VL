import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Invite token or magic link token' })
  @IsString()
  token: string;

  @ApiProperty({ description: 'Username for the user', required: false })
  @IsOptional()
  @IsString()
  username?: string;
}
