import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CryptoService } from './crypto.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('crypto')
@Controller('crypto')
export class CryptoController {
  constructor(private readonly cryptoService: CryptoService) {}

  @Public()
  @Get('prix')
  getPrix(@Query('coins') coins?: string) {
    const listeCoins = coins ? coins.split(',') : ['bitcoin', 'ethereum'];
    return this.cryptoService.getPrix(listeCoins);
  }
}