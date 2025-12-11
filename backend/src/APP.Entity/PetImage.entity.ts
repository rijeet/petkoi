import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { Pet } from './Pet.entity';

@Entity('pet_images')
@Index(['petId'])
export class PetImage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  petId!: string;

  @ManyToOne(() => Pet, (pet: Pet) => pet.images, { onDelete: 'CASCADE' })
  pet!: Pet;

  @Column()
  url!: string;

  @Column()
  fileId!: string;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  tags!: string[];

  @Column()
  uploadedBy!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  createdAt!: Date;
}

