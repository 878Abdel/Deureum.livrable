import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TontinesService } from './tontines.service';
import { TontinesController } from './tontines.controller';
import { Tontine } from './entities/tontine.entity';
import { TontineMembre } from './entities/tontine-membre.entity';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tontine, TontineMembre]), WalletModule],
  controllers: [TontinesController],
  providers: [TontinesService],
  exports: [TontinesService],
})
export class TontinesModule {}