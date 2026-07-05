import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { Tontine } from './tontine.entity';
import { User } from '../../users/entities/user.entity';

@Entity('tontine_membres')
export class TontineMembre {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Tontine, (tontine) => tontine.membres, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tontineId' })
  tontine!: Tontine;

  @Column()
  tontineId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  userId!: number;

  @Column()
  ordrePassage!: number;
}