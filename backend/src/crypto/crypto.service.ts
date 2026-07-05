import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface CacheEntry {
  data: any;
  timestamp: number;
}

@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);
  private cache: Map<string, CacheEntry> = new Map();
  private readonly DUREE_CACHE_MS = 60_000; // 60 secondes

  constructor(private readonly httpService: HttpService) {}

  async getPrix(coins: string[]): Promise<any> {
    const cleCache = coins.sort().join(',');
    const entreeCache = this.cache.get(cleCache);

    const maintenant = Date.now();
    if (entreeCache && maintenant - entreeCache.timestamp < this.DUREE_CACHE_MS) {
      this.logger.log(`Cache hit pour ${cleCache}`);
      return entreeCache.data;
    }

    try {
      const url = 'https://api.coingecko.com/api/v3/simple/price';
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            ids: coins.join(','),
            vs_currencies: 'usd',
            include_24hr_change: true,
          },
        }),
      );

      this.cache.set(cleCache, { data: response.data, timestamp: maintenant });
      return response.data;
    } catch (error) {
      this.logger.error('Erreur appel CoinGecko', error);

      // Si on a une vieille entrée en cache, mieux vaut la retourner que rien
      if (entreeCache) {
        return entreeCache.data;
      }
      throw error;
    }
  }
}