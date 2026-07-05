import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IaService } from './ia.service';
import { IaController } from './ia.controller';
import { ConseilIA } from './entities/conseil-ia.entity';
import { TransactionsModule } from '../transactions/transactions.module';
import { ObjectifsModule } from '../objectifs/objectifs.module';
import { TontinesModule } from '../tontines/tontines.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    HttpModule.register({ timeout: 15000 }),
    TypeOrmModule.forFeature([ConseilIA]),
    TransactionsModule,
    ObjectifsModule,
    TontinesModule,
    WalletModule,
  ],
  controllers: [IaController],
  providers: [IaService],
})
export class IaModule {}