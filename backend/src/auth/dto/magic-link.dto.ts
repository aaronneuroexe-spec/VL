import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class MagicLinkDto {
  @ApiProperty({ description: 'Email address for magic link' })
  @IsEmail()
  email: string;
}
