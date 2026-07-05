import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TypeTransaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly walletService: WalletService,
  ) {}

  async create(userId: number, dto: CreateTransactionDto): Promise<Transaction> {
    const transaction = this.transactionRepository.create({ ...dto, userId });
    const savedTransaction = await this.transactionRepository.save(transaction);

    // Mettre à jour le solde du wallet
    const montant = Number(dto.montant);
    if (dto.type === TypeTransaction.REVENU) {
      await this.walletService.ajusterSolde(userId, montant);
    } else if (dto.type === TypeTransaction.DEPENSE) {
      await this.walletService.ajusterSolde(userId, -montant);
    }

    return savedTransaction;
  }

  async findAllByUser(userId: number): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { userId },
      order: { date: 'DESC' },
    });
  }

  async findOne(id: number, userId: number): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({ where: { id } });
    if (!transaction) {
      throw new NotFoundException(`Transaction ${id} introuvable`);
    }
    if (transaction.userId !== userId) {
      throw new ForbiddenException('Cette transaction ne vous appartient pas');
    }
    return transaction;
  }

  async update(id: number, userId: number, dto: UpdateTransactionDto): Promise<Transaction> {
    const transaction = await this.findOne(id, userId);
    
    // Ajuster le solde si le montant ou le type change
    const oldMontant = Number(transaction.montant);
    const oldType = transaction.type;
    const newMontant = Number(dto.montant);
    const newType = dto.type;

    Object.assign(transaction, dto);
    const savedTransaction = await this.transactionRepository.save(transaction);

    // Recalculer l'ajustement du solde
    let ajustement = 0;
    if (oldType === TypeTransaction.REVENU) {
      ajustement -= oldMontant;
    } else if (oldType === TypeTransaction.DEPENSE) {
      ajustement += oldMontant;
    }
    if (newType === TypeTransaction.REVENU) {
      ajustement += newMontant;
    } else if (newType === TypeTransaction.DEPENSE) {
      ajustement -= newMontant;
    }

    if (ajustement !== 0) {
      await this.walletService.ajusterSolde(userId, ajustement);
    }

    return savedTransaction;
  }

  async remove(id: number, userId: number): Promise<void> {
    const transaction = await this.findOne(id, userId);
    
    // Ajuster le solde avant suppression
    const montant = Number(transaction.montant);
    if (transaction.type === TypeTransaction.REVENU) {
      await this.walletService.ajusterSolde(userId, -montant);
    } else if (transaction.type === TypeTransaction.DEPENSE) {
      await this.walletService.ajusterSolde(userId, montant);
    }

    await this.transactionRepository.remove(transaction);
  }

  async getStats(userId: number) {
    const transactions = await this.findAllByUser(userId);

    const totalRevenus = transactions
      .filter(t => t.type === TypeTransaction.REVENU)
      .reduce((sum, t) => sum + Number(t.montant), 0);

    const totalDepenses = transactions
      .filter(t => t.type === TypeTransaction.DEPENSE)
      .reduce((sum, t) => sum + Number(t.montant), 0);

    const solde = totalRevenus - totalDepenses;

    const parCategorie: Record<string, number> = {};
    transactions
      .filter(t => t.type === TypeTransaction.DEPENSE)
      .forEach(t => {
        parCategorie[t.categorie] = (parCategorie[t.categorie] || 0) + Number(t.montant);
      });

    return {
      totalRevenus,
      totalDepenses,
      solde,
      parCategorie,
      nombreTransactions: transactions.length,
    };
  }
}