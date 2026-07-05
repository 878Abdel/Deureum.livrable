import { PartialType } from '@nestjs/mapped-types';
import { CreateObjectifDto } from './create-objectif.dto';

export class UpdateObjectifDto extends PartialType(CreateObjectifDto) {}