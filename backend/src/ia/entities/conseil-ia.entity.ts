import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('conseils_ia')
export class ConseilIA {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('text')
  texte!: string;

  @Column('json', { nullable: true })
  statsUtilisees!: object;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  userId!: number;

  @CreateDateColumn()
  createdAt!: Date;
}