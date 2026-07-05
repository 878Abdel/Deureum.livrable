import { IsString, IsNumber } from 'class-validator';

export class CreateTontineDto {
  @IsString()
  nom!: string;

  @IsNumber()
  montantParTour!: number;

  @IsString()
  frequence!: string;
}