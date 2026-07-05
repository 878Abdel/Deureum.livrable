import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { TransactionsModule } from './transactions/transactions.module';
import { ObjectifsModule } from './objectifs/objectifs.module';
import { TontinesModule } from './tontines/tontines.module';
import { WalletModule } from './wallet/wallet.module';
import { CryptoModule } from './crypto/crypto.module';
import { IaModule } from './ia/ia.module';
import { BourseModule } from './bourse/bourse.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST'),
        port: parseInt(config.get<string>('DB_PORT') ?? '3306', 10),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: true,
        ssl: { rejectUnauthorized: false },
        extra: { connectTimeout: 30000 },
      }),
    }),
    UsersModule,
    AuthModule,
    TransactionsModule,
    ObjectifsModule,
    TontinesModule,
    WalletModule,
    CryptoModule,
    IaModule,
    BourseModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}