import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { ConseilIA } from './entities/conseil-ia.entity';
import { TransactionsService } from '../transactions/transactions.service';
import { ObjectifsService } from '../objectifs/objectifs.service';
import { TontinesService } from '../tontines/tontines.service';
import { WalletService } from '../wallet/wallet.service';

const execFileAsync = promisify(execFile);

@Injectable()
export class IaService {
  private readonly logger = new Logger(IaService.name);

  constructor(
    @InjectRepository(ConseilIA)
    private readonly conseilRepository: Repository<ConseilIA>,
    private readonly transactionsService: TransactionsService,
    private readonly objectifsService: ObjectifsService,
    private readonly tontinesService: TontinesService,
    private readonly walletService: WalletService,
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {}

  async genererConseil(userId: number): Promise<ConseilIA> {
    // 1. Récupérer TOUTES les données financières du user
    const transactions = await this.transactionsService.findAllByUser(userId);
    const objectifs = await this.objectifsService.findAllByUser(userId);
    const tontines = await this.tontinesService.findAllByUser(userId);
    const wallet = await this.walletService.getMoi(userId);

    // 2. Appeler le script Python pour les stats
    const stats = await this.analyserAvecPython(transactions);

    // 3. Calculer les statistiques complètes
    const totalObjectifs = objectifs.reduce((sum, obj) => sum + Number(obj.montantCible), 0);
    const totalEpargne = objectifs.reduce((sum, obj) => sum + Number(obj.montantActuel), 0);
    const totalTontines = tontines.reduce((sum, tontine) => sum + Number(tontine.totalVersements || 0), 0);
    const objectifsEnCours = objectifs.filter(obj => {
      const progress = (Number(obj.montantActuel) / Number(obj.montantCible)) * 100;
      return progress < 100;
    }).length;

    // 4. Construire le prompt avec toutes les données financières
    const prompt = `Tu es un conseiller financier pour une app sénégalaise appelée DEUREUM.
Voici les données financières complètes d'un utilisateur :

TRANSACTIONS :
- Total dépenses : ${stats.totalDepenses} FCFA
- Total revenus : ${stats.totalRevenus} FCFA
- Solde net : ${stats.totalRevenus - stats.totalDepenses} FCFA
- Catégorie la plus dépensière : ${stats.categoriePlusDepensiere ?? 'aucune'}
- Tendance des dépenses : ${stats.tendance}

WALLET :
- Solde principal : ${Number(wallet.soldeTotal)} FCFA

OBJECTIFS D'ÉPARGNE (${objectifs.length} objectifs) :
- Montant total cible : ${totalObjectifs} FCFA
- Montant total épargné : ${totalEpargne} FCFA
- Objectifs en cours : ${objectifsEnCours}
${objectifs.length > 0 ? objectifs.map(obj => `- ${obj.titre}: ${Number(obj.montantActuel)}/${Number(obj.montantCible)} FCFA (${Math.round((Number(obj.montantActuel) / Number(obj.montantCible)) * 100)}%)`).join('\n') : '- Aucun objectif'}

TONTINES (${tontines.length} groupes) :
- Total versé dans les tontines : ${totalTontines} FCFA
${tontines.length > 0 ? tontines.map(t => `- ${t.nom}: Tour ${t.tourActuel}, ${Number(t.montantParTour)} FCFA/tour, Total versé: ${Number(t.totalVersements || 0)} FCFA`).join('\n') : '- Aucune tontine'}

Donne 3 conseils financiers concrets, courts (1-2 phrases chacun), pertinents pour le contexte sénégalais en tenant compte de TOUTES ces informations (transactions, wallet, objectifs d'épargne et tontines). Réponds uniquement avec les 3 conseils numérotés, sans préambule.`;
    const texteConseil = await this.appelerGemini(prompt);

    // 5. Stocker en base avec toutes les stats
    const conseil = this.conseilRepository.create({
      texte: texteConseil,
      statsUtilisees: {
        ...stats,
        walletSolde: Number(wallet.soldeTotal),
        objectifs: {
          total: objectifs.length,
          totalCible: totalObjectifs,
          totalEpargne: totalEpargne,
          enCours: objectifsEnCours,
        },
        tontines: {
          total: tontines.length,
          totalVerse: totalTontines,
        },
      },
      userId,
    });

    return this.conseilRepository.save(conseil);
  }

  async discuter(userId: number, message: string, conversation: Array<{ role: string; content: string }>): Promise<{ texte: string }> {
    const transactions = await this.transactionsService.findAllByUser(userId);
    const stats = await this.analyserAvecPython(transactions);

    const historique = conversation
      .filter((entry) => entry?.role && entry?.content)
      .slice(-8)
      .map((entry) => `${entry.role === 'assistant' ? 'IBA' : 'Utilisateur'}: ${entry.content}`)
      .join('\n');

    const prompt = `Tu es IBA, un assistant financier conversationnel pour DEUREUM.
Tu réponds en français, de façon claire, brève et utile.
Tu peux rebondir sur les conseils financiers précédents et répondre comme dans une vraie discussion.
Évite les discours trop longs. Propose des actions concrètes quand c'est pertinent.

Contexte financier actuel:
- Total dépenses: ${stats.totalDepenses} FCFA
- Total revenus: ${stats.totalRevenus} FCFA
- Catégorie la plus dépensière: ${stats.categoriePlusDepensiere ?? 'aucune'}
- Tendance des dépenses: ${stats.tendance}

Conversation récente:
${historique || 'Aucune conversation précédente.'}

Message de l'utilisateur:
${message}

Réponds uniquement avec la réponse de IBA, sans préambule.`;

    const texte = await this.appelerGemini(prompt);
    return { texte };
  }

  private async analyserAvecPython(transactions: any[]): Promise<any> {
    const scriptPath = path.join(process.cwd(), 'python-scripts', 'analyse.py');
    const jsonData = JSON.stringify(transactions);

    try {
      const { stdout } = await execFileAsync('python', [scriptPath, jsonData]);
      return JSON.parse(stdout.trim());
    } catch (error) {
      this.logger.error('Erreur script Python', error);
      return {
        categoriePlusDepensiere: null,
        totalDepenses: 0,
        totalRevenus: 0,
        tendance: 'inconnu',
      };
    }
  }

  private async appelerGemini(prompt: string): Promise<string> {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    const geminiModel = this.config.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, {
          contents: [{ parts: [{ text: prompt }] }],
        }),
      );

      return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
      this.logger.error('Erreur appel Gemini', error);
      return "Désolé, impossible de générer un conseil pour le moment. Réessayez plus tard.";
    }
  }

  async getHistorique(userId: number): Promise<ConseilIA[]> {
    return this.conseilRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}