import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from 'typeorm';
import { Pet } from './Pet.entity';
import { User } from './User.entity';
import { PetTagOrderStatus } from './enums';

@Entity('pet_tag_orders')
@Index(['petId'])
@Index(['userId'])
@Index(['status'])
@Index(['createdAt'])
export class PetTagOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  petId!: string;

  @ManyToOne(() => Pet, (pet: Pet) => pet.petTagOrders, { onDelete: 'CASCADE' })
  pet!: Pet;

  @Column()
  userId!: string;

  @ManyToOne(() => User, (user: User) => user.petTagOrders, { onDelete: 'CASCADE' })
  user!: User;

  @Column()
  qrUrl!: string;

  @Column()
  tagColor!: string;

  @Column({ default: '32mm' })
  tagSize!: string;

  @Column({ nullable: true })
  previewUrl?: string;

  @Column({ type: 'enum', enum: PetTagOrderStatus, default: PetTagOrderStatus.PENDING })
  status!: PetTagOrderStatus;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', default: () => 'NOW()', onUpdate: 'NOW()' })
  updatedAt!: Date;
}

