import { IsNumber, IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateObjectifDto {
  @IsString()
  titre!: string;

  @IsNumber()
  montantCible!: number;

  @IsDateString()
  deadline!: string;

  @IsOptional()
  @IsString()
  couleur?: string;
}