import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { Pet } from './Pet.entity';

@Entity('vaccines')
@Index(['petId'])
@Index(['nextDueDate'])
export class Vaccine {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  petId!: string;

  @ManyToOne(() => Pet, (pet: Pet) => pet.vaccines, { onDelete: 'CASCADE' })
  pet!: Pet;

  @Column()
  name!: string;

  @Column({ type: 'int', nullable: true })
  doseNumber?: number;

  @Column({ nullable: true })
  clinic?: string;

  @Column({ type: 'timestamptz' })
  injectionDate!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  nextDueDate?: Date;

  @Column({ type: 'jsonb', nullable: true })
  extractedMeta?: Record<string, any>;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  createdAt!: Date;
}

