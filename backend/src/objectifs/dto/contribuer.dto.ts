import { IsNumber, Min } from 'class-validator';

export class ContribuerDto {
  @IsNumber()
  @Min(0.01)
  montant!: number;
}