import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany,
} from 'typeorm';
import { TontineMembre } from './tontine-membre.entity';

@Entity('tontines')
export class Tontine {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nom!: string;

  @Column('decimal', { precision: 12, scale: 2 })
  montantParTour!: number;

  @Column()
  frequence!: string; // "hebdomadaire" | "mensuelle"

  @Column({ default: 1 })
  tourActuel!: number;

  @Column({ type: 'varchar', length: 10, unique: true, nullable: true })
  code!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalVersements!: number;

  @Column({ type: 'date', nullable: true })
  prochainVersement!: Date | null;

  @OneToMany(() => TontineMembre, (membre) => membre.tontine, { cascade: true })
  membres!: TontineMembre[];

  @CreateDateColumn()
  createdAt!: Date;
}