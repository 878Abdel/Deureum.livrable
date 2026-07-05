import { IsNumber } from 'class-validator';

export class AjouterMembreDto {
  @IsNumber()
  userId!: number;

  @IsNumber()
  ordrePassage!: number;
}