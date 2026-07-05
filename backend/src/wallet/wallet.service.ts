import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
  ) {}

  async getOrCreate(userId: number): Promise<Wallet> {
    let wallet = await this.walletRepository.findOne({ where: { userId } });
    if (!wallet) {
      wallet = this.walletRepository.create({ userId, soldeTotal: 0 });
      wallet = await this.walletRepository.save(wallet);
    }
    return wallet;
  }

  async ajusterSolde(userId: number, montant: number): Promise<Wallet> {
    const wallet = await this.getOrCreate(userId);
    wallet.soldeTotal = Number(wallet.soldeTotal) + montant;
    return this.walletRepository.save(wallet);
  }

  async getMoi(userId: number): Promise<Wallet> {
    return this.getOrCreate(userId);
  }
}