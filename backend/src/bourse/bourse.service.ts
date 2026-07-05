import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface MarketstackEodItem {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  date: string;
  name?: string;
  exchange?: string;
}

interface MarketstackResponse {
  data: MarketstackEodItem[];
}

const TICKERS_DEFAUT = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'META'];
const DUREE_CACHE_MS = 24 * 60 * 60 * 1000; // 24 heures
const BASE_URL = 'https://api.marketstack.com/v1';

@Injectable()
export class BourseService {
  private readonly logger = new Logger(BourseService.name);
  private readonly cache = new Map<string, CacheEntry<unknown>>();

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {}

  private getCache<T>(cle: string): T | null {
    const entree = this.cache.get(cle);
    if (!entree) return null;
    if (Date.now() - entree.timestamp > DUREE_CACHE_MS) {
      this.cache.delete(cle);
      return null;
    }
    return entree.data as T;
  }

  private setCache<T>(cle: string, data: T): void {
    this.cache.set(cle, { data, timestamp: Date.now() });
  }

  private get apiKey(): string {
    return this.config.get<string>('MARKETSTACK_API_KEY') ?? '';
  }

  async getMarche(symbols?: string[]): Promise<unknown[]> {
    const tickers = symbols?.length ? symbols : TICKERS_DEFAUT;
    const cleCache = `marche:${tickers.sort().join(',')}`;

    const cached = this.getCache<unknown[]>(cleCache);
    if (cached) {
      this.logger.log(`Cache hit marché — ${tickers.join(',')}`);
      return cached;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get<MarketstackResponse>(`${BASE_URL}/eod/latest`, {
          params: {
            access_key: this.apiKey,
            symbols: tickers.join(','),
          },
        }),
      );

      const donnees = response.data?.data ?? [];

      // Construire un résumé enrichi par ticker
      const resultat = tickers.map((symbol) => {
        const item = donnees.find((d) => d.symbol === symbol);
        if (!item) return { symbol, disponible: false };

        return {
          symbol: item.symbol,
          nom: item.name ?? symbol,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume,
          date: item.date,
          exchange: item.exchange ?? 'N/A',
          variation: item.open > 0
            ? Number(((item.close - item.open) / item.open * 100).toFixed(2))
            : 0,
          disponible: true,
        };
      });

      this.setCache(cleCache, resultat);
      return resultat;
    } catch (error: unknown) {
      this.logger.error('Erreur Marketstack /eod/latest', error);
      const cached = this.getCache<unknown[]>(cleCache);
      if (cached) return cached;
      throw error;
    }
  }

  async getHistorique(symbol: string, jours = 30): Promise<unknown[]> {
    const cleCache = `historique:${symbol}:${jours}`;

    const cached = this.getCache<unknown[]>(cleCache);
    if (cached) {
      this.logger.log(`Cache hit historique — ${symbol}`);
      return cached;
    }

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - jours);
    const dateTo = new Date();

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    try {
      const response = await firstValueFrom(
        this.httpService.get<MarketstackResponse>(`${BASE_URL}/eod`, {
          params: {
            access_key: this.apiKey,
            symbols: symbol,
            date_from: formatDate(dateFrom),
            date_to: formatDate(dateTo),
            sort: 'ASC',
            limit: jours,
          },
        }),
      );

      const donnees = (response.data?.data ?? []).map((item) => ({
        date: item.date.split('T')[0],
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,
      }));

      this.setCache(cleCache, donnees);
      return donnees;
    } catch (error: unknown) {
      this.logger.error(`Erreur Marketstack historique ${symbol}`, error);
      const cached = this.getCache<unknown[]>(cleCache);
      if (cached) return cached;
      throw error;
    }
  }

  getTickers(): Array<{ symbol: string; nom: string; secteur: string }> {
    // Liste statique des tickers supportés — évite de consommer des requêtes API
    return [
      { symbol: 'AAPL', nom: 'Apple Inc.', secteur: 'Technologie' },
      { symbol: 'MSFT', nom: 'Microsoft Corp.', secteur: 'Technologie' },
      { symbol: 'GOOGL', nom: 'Alphabet Inc.', secteur: 'Technologie' },
      { symbol: 'TSLA', nom: 'Tesla Inc.', secteur: 'Automobile' },
      { symbol: 'META', nom: 'Meta Platforms', secteur: 'Technologie' },
      { symbol: 'AMZN', nom: 'Amazon.com Inc.', secteur: 'E-commerce' },
      { symbol: 'NVDA', nom: 'NVIDIA Corp.', secteur: 'Semi-conducteurs' },
      { symbol: 'JPM', nom: 'JPMorgan Chase', secteur: 'Finance' },
      { symbol: 'V', nom: 'Visa Inc.', secteur: 'Finance' },
      { symbol: 'WMT', nom: 'Walmart Inc.', secteur: 'Distribution' },
    ];
  }

  getCacheInfo(): object {
    const entrees = Array.from(this.cache.entries()).map(([cle, val]) => ({
      cle,
      age: Math.round((Date.now() - val.timestamp) / 1000 / 60),
      expiresDans: Math.round((DUREE_CACHE_MS - (Date.now() - val.timestamp)) / 1000 / 60),
    }));
    return { entrees, total: entrees.length, dureeCache: '24h' };
  }
}
