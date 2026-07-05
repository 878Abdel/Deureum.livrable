import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Tontine } from './entities/tontine.entity';
import { TontineMembre } from './entities/tontine-membre.entity';
import { CreateTontineDto } from './dto/create-tontine.dto';
import { AjouterMembreDto } from './dto/ajouter-membre.dto';
import { RejoindreTontineDto } from './dto/rejoindre-tontine.dto';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class TontinesService {
  constructor(
    @InjectRepository(Tontine)
    private readonly tontineRepository: Repository<Tontine>,
    @InjectRepository(TontineMembre)
    private readonly membreRepository: Repository<TontineMembre>,
    private readonly walletService: WalletService,
  ) {}

  private async genererCodeUnique(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const code = randomBytes(4).toString('hex').toUpperCase().slice(0, 8);
      const existant = await this.tontineRepository.findOne({ where: { code } });
      if (!existant) return code;
    }
    throw new BadRequestException('Impossible de générer un code d\'invitation');
  }

  async create(userId: number, dto: CreateTontineDto): Promise<Tontine> {
    const code = await this.genererCodeUnique();
    
    // Calculer la date du prochain versement
    const prochainVersement = this.calculerProchainVersement(dto.frequence);
    
    const tontine = this.tontineRepository.create({ 
      ...dto, 
      code,
      totalVersements: 0,
      prochainVersement,
    });
    const saved = await this.tontineRepository.save(tontine);

    // Le créateur devient automatiquement le 1er membre
    const premierMembre = this.membreRepository.create({
      tontineId: saved.id,
      userId,
      ordrePassage: 1,
    });
    await this.membreRepository.save(premierMembre);

    return this.findOne(saved.id, userId);
  }

  private calculerProchainVersement(frequence: string): Date {
    const date = new Date();
    if (frequence === 'hebdomadaire') {
      date.setDate(date.getDate() + 7);
    } else if (frequence === 'mensuelle') {
      date.setMonth(date.getMonth() + 1);
    }
    return date;
  }

  async findAllByUser(userId: number): Promise<Tontine[]> {
    const membres = await this.membreRepository.find({ where: { userId } });
    const tontineIds = membres.map((m) => m.tontineId);

    if (tontineIds.length === 0) return [];

    const tontines = await this.tontineRepository.find({
      where: tontineIds.map((id) => ({ id })),
      relations: { membres: { user: true } },
    });

    for (const tontine of tontines) {
      if (!tontine.code) {
        tontine.code = await this.genererCodeUnique();
        await this.tontineRepository.save(tontine);
      }
    }

    return tontines;
  }

  async findOne(id: number, userId: number): Promise<Tontine> {
    const tontine = await this.tontineRepository.findOne({
      where: { id },
     relations: { membres: { user: true } },
    });
    if (!tontine) {
      throw new NotFoundException(`Tontine ${id} introuvable`);
    }

    const estMembre = tontine.membres.some((m) => m.userId === userId);
    if (!estMembre) {
      throw new ForbiddenException('Vous ne faites pas partie de cette tontine');
    }

    return tontine;
  }

  async rejoindreParCode(userId: number, dto: RejoindreTontineDto): Promise<Tontine> {
    const code = dto.code.trim().toUpperCase();
    const tontine = await this.tontineRepository.findOne({
      where: { code },
      relations: { membres: true },
    });

    if (!tontine) {
      throw new NotFoundException('Code de tontine invalide');
    }

    const dejaMembre = tontine.membres.some((m) => m.userId === userId);
    if (dejaMembre) {
      throw new ConflictException('Vous faites déjà partie de cette tontine');
    }

    const prochainOrdre = tontine.membres.length > 0
      ? Math.max(...tontine.membres.map((m) => m.ordrePassage)) + 1
      : 1;

    const membre = this.membreRepository.create({
      tontineId: tontine.id,
      userId,
      ordrePassage: prochainOrdre,
    });
    await this.membreRepository.save(membre);

    return this.findOne(tontine.id, userId);
  }

  async ajouterMembre(tontineId: number, userId: number, dto: AjouterMembreDto): Promise<Tontine> {
    await this.findOne(tontineId, userId); // vérifie l'accès

    const membre = this.membreRepository.create({
      tontineId,
      userId: dto.userId,
      ordrePassage: dto.ordrePassage,
    });
    await this.membreRepository.save(membre);

    return this.findOne(tontineId, userId);
  }

  async tourSuivant(id: number, userId: number): Promise<Tontine> {
    const tontine = await this.findOne(id, userId);
    tontine.tourActuel += 1;
    tontine.totalVersements = Number(tontine.totalVersements) + Number(tontine.montantParTour);
    
    // Mettre à jour la date du prochain versement
    tontine.prochainVersement = this.calculerProchainVersement(tontine.frequence);
    
    // Déduire le montant du tour du wallet
    await this.walletService.ajusterSolde(userId, -tontine.montantParTour);
    
    return this.tontineRepository.save(tontine);
  }

  async remove(id: number, userId: number): Promise<void> {
    const tontine = await this.findOne(id, userId);
    await this.tontineRepository.remove(tontine);
  }
}