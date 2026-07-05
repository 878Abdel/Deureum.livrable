import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Objectif } from './entities/objectif.entity';
import { CreateObjectifDto } from './dto/create-objectif.dto';
import { UpdateObjectifDto } from './dto/update-objectif.dto';
import { ContribuerDto } from './dto/contribuer.dto';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class ObjectifsService {
  constructor(
    @InjectRepository(Objectif)
    private readonly objectifRepository: Repository<Objectif>,
    private readonly walletService: WalletService,
  ) {}

  async create(userId: number, dto: CreateObjectifDto): Promise<Objectif> {
    const objectif = this.objectifRepository.create({ ...dto, userId });
    return this.objectifRepository.save(objectif);
  }

  async findAllByUser(userId: number): Promise<Objectif[]> {
    return this.objectifRepository.find({ where: { userId } });
  }

  async findOne(id: number, userId: number): Promise<Objectif> {
    const objectif = await this.objectifRepository.findOne({ where: { id } });
    if (!objectif) {
      throw new NotFoundException(`Objectif ${id} introuvable`);
    }
    if (objectif.userId !== userId) {
      throw new ForbiddenException('Cet objectif ne vous appartient pas');
    }
    return objectif;
  }

  async update(id: number, userId: number, dto: UpdateObjectifDto): Promise<Objectif> {
    const objectif = await this.findOne(id, userId);
    Object.assign(objectif, dto);
    return this.objectifRepository.save(objectif);
  }

  async contribuer(id: number, userId: number, dto: ContribuerDto): Promise<Objectif> {
    const objectif = await this.findOne(id, userId);
    objectif.montantActuel = Number(objectif.montantActuel) + dto.montant;
    
    // Déduire le montant du wallet (l'épargne est une dépense du wallet principal)
    await this.walletService.ajusterSolde(userId, -dto.montant);
    
    return this.objectifRepository.save(objectif);
  }

  async remove(id: number, userId: number): Promise<void> {
    const objectif = await this.findOne(id, userId);
    await this.objectifRepository.remove(objectif);
  }
}