import { IsNumber, IsEnum, IsString, IsDateString, IsOptional } from 'class-validator';
import { TypeTransaction } from '../entities/transaction.entity';

export class CreateTransactionDto {
  @IsNumber()
  montant!: number;

  @IsEnum(TypeTransaction)
  type!: TypeTransaction;

  @IsString()
  categorie!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  date!: string;
}