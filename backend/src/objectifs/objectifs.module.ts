import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObjectifsService } from './objectifs.service';
import { ObjectifsController } from './objectifs.controller';
import { Objectif } from './entities/objectif.entity';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [TypeOrmModule.forFeature([Objectif]), WalletModule],
  exports: [ObjectifsService],
  controllers: [ObjectifsController],
  providers: [ObjectifsService],
})
export class ObjectifsModule {}