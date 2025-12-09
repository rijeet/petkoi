import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { Pet } from './Pet.entity';
import { User } from './User.entity';

@Entity('ownership_history')
@Index(['petId'])
@Index(['newOwnerId'])
@Index(['previousOwnerId'])
export class OwnershipHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  petId!: string;

  @ManyToOne(() => Pet, (pet: Pet) => pet.history, { onDelete: 'CASCADE' })
  pet!: Pet;

  @Column({ nullable: true })
  previousOwnerId?: string;

  @ManyToOne(() => User, (user: User) => user.previousOwnershipHistory, { onDelete: 'SET NULL' })
  previousOwner?: User;

  @Column({ nullable: true })
  newOwnerId?: string;

  @ManyToOne(() => User, (user: User) => user.newOwnershipHistory, { onDelete: 'SET NULL' })
  newOwner?: User;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  transferredAt!: Date;

  @Column({ type: 'text', nullable: true })
  note?: string;
}

