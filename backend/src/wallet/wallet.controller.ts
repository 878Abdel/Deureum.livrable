import { Controller, Get, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WalletService } from './wallet.service';

@ApiTags('wallet')
@ApiBearerAuth('access-token')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('moi')
  getMoi(@Request() req: any) {
    return this.walletService.getMoi(req.user.id);
  }
}