import {
  Controller, Get, Param, Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BourseService } from './bourse.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('bourse')
@Public()
@Controller('bourse')
export class BourseController {
  constructor(private readonly bourseService: BourseService) {}

  /**
   * Dernières données EOD pour une liste de tickers
   * GET /bourse/marche
   * GET /bourse/marche?symbols=AAPL,MSFT
   */
  @Get('marche')
  getMarche(@Query('symbols') symbols?: string) {
    const liste = symbols
      ? symbols.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
      : undefined;
    return this.bourseService.getMarche(liste);
  }

  /**
   * Historique des 30 derniers jours pour un ticker
   * GET /bourse/historique/AAPL
   * GET /bourse/historique/AAPL?jours=60
   */
  @Get('historique/:symbol')
  getHistorique(
    @Param('symbol') symbol: string,
    @Query('jours') jours?: string,
  ) {
    return this.bourseService.getHistorique(
      symbol.toUpperCase(),
      jours ? parseInt(jours, 10) : 30,
    );
  }

  /**
   * Liste statique des tickers disponibles — ne consomme pas de quota API
   * GET /bourse/tickers
   */
  @Get('tickers')
  getTickers() {
    return this.bourseService.getTickers();
  }

  /**
   * Info sur l'état du cache (debug)
   * GET /bourse/cache
   */
  @Get('cache')
  getCacheInfo() {
    return this.bourseService.getCacheInfo();
  }
}
