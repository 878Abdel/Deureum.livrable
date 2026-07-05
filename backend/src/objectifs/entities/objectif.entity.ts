import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('objectifs')
export class Objectif {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  titre!: string;

  @Column('decimal', { precision: 12, scale: 2 })
  montantCible!: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  montantActuel!: number;

  @Column({ type: 'date' })
  deadline!: string;

  @Column({ default: '#E8FF5A' })
  couleur!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  userId!: number;

  @CreateDateColumn()
  createdAt!: Date;
}