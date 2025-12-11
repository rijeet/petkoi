import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { Pet } from './Pet.entity';

@Entity('qr_scan_logs')
@Index(['petId'])
@Index(['createdAt'])
export class QRScanLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  petId?: string;

  @ManyToOne(() => Pet, (pet: Pet) => pet.qrScans, { onDelete: 'SET NULL' })
  pet?: Pet;

  @Column({ nullable: true })
  scannerIp?: string;

  @Column({ nullable: true })
  scannerUserAgent?: string;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  createdAt!: Date;
}

