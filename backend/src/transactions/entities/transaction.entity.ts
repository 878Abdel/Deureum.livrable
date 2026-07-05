import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TypeTransaction {
  REVENU = 'revenu',
  DEPENSE = 'depense',
  TRANSFERT = 'transfert',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('decimal', { precision: 12, scale: 2 })
  montant!: number;

  @Column({ type: 'enum', enum: TypeTransaction })
  type!: TypeTransaction;

  @Column()
  categorie!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({ type: 'date' })
  date!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  userId!: number;

  @CreateDateColumn()
  createdAt!: Date;
}