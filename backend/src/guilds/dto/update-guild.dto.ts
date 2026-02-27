import { PartialType } from '@nestjs/swagger';
import { CreateGuildDto } from './create-guild.dto';

export class UpdateGuildDto extends PartialType(CreateGuildDto) {}
