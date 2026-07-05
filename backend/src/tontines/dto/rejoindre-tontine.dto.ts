import { IsNotEmpty, IsString, Length } from 'class-validator';

export class RejoindreTontineDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 10)
  code!: string;
}
