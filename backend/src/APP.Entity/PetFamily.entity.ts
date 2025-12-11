import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { Pet } from './Pet.entity';
import { RelationType } from './enums';

@Entity('pet_family')
@Index(['petId'])
export class PetFamily {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  petId!: string;

  @ManyToOne(() => Pet, (pet: Pet) => pet.family, { onDelete: 'CASCADE' })
  pet!: Pet;

  @Column({ nullable: true })
  parentId?: string;

  @Column({ type: 'enum', enum: RelationType })
  relation!: RelationType;
}

