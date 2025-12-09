import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { Pet } from './Pet.entity';

@Entity('gps_location_history')
@Index(['petId'])
@Index(['geohash'])
@Index(['recordedAt'])
export class GPSLocationHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  petId!: string;

  @ManyToOne(() => Pet, (pet: Pet) => pet.gpsHistory, { onDelete: 'CASCADE' })
  pet!: Pet;

  @Column({ type: 'double precision' })
  lat!: number;

  @Column({ type: 'double precision' })
  lng!: number;

  @Column()
  geohash!: string;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  recordedAt!: Date;
}

