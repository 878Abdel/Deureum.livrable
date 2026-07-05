import { Body, Controller, Post, Get, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IaService } from './ia.service';

class ChatMessageDto {
  @ApiProperty({ example: 'user', enum: ['user', 'assistant'] })
  @IsString()
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @ApiProperty({ example: 'Quel est mon solde ?' })
  @IsString()
  content!: string;
}

class DiscuterDto {
  @ApiProperty({ example: 'Quel est mon solde actuel ?' })
  @IsString()
  message!: string;

  @ApiProperty({ type: [ChatMessageDto], default: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  conversation!: ChatMessageDto[];
}

@ApiTags('ia')
@ApiBearerAuth('access-token')
@Controller('ia')
export class IaController {
  constructor(private readonly iaService: IaService) {}

  @Post('conseil')
  genererConseil(@Request() req: any) {
    return this.iaService.genererConseil(req.user.id);
  }

  @Post('discuter')
  discuter(@Request() req: any, @Body() dto: DiscuterDto) {
    return this.iaService.discuter(req.user.id, dto.message, dto.conversation ?? []);
  }

  @Get('historique')
  getHistorique(@Request() req: any) {
    return this.iaService.getHistorique(req.user.id);
  }
}