import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { PetType, Gender } from './enums';
import { User } from './User.entity';
import { PetImage } from './PetImage.entity';
import { Vaccine } from './Vaccine.entity';
import { PetFamily } from './PetFamily.entity';
import { OwnershipHistory } from './OwnershipHistory.entity';
import { GPSLocationHistory } from './GPSLocationHistory.entity';
import { QRScanLog } from './QRScanLog.entity';
import { PetTagOrder } from './PetTagOrder.entity';

@Entity('pets')
@Index(['ownerId'])
@Index(['isLost'])
@Index(['type'])
export class Pet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  breed?: string;

  @Column({ nullable: true })
  color?: string;

  @Column({ type: 'timestamptz', nullable: true })
  dateOfBirth?: Date;

  @Column({ default: false })
  neutered!: boolean;

  @Column({ type: 'enum', enum: Gender })
  gender!: Gender;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: PetType })
  type!: PetType;

  @Column({ nullable: true })
  qrCodeUrl?: string;

  @Column({ default: false })
  isLost!: boolean;

  @Column({ nullable: true })
  ownerId?: string;

  @ManyToOne(() => User, (user: User) => user.pets, { onDelete: 'SET NULL' })
  owner?: User;

  @OneToMany(() => PetImage, (image: PetImage) => image.pet)
  images!: PetImage[];

  @OneToMany(() => Vaccine, (vaccine: Vaccine) => vaccine.pet)
  vaccines!: Vaccine[];

  @OneToMany(() => PetFamily, (family: PetFamily) => family.pet)
  family!: PetFamily[];

  @OneToMany(() => OwnershipHistory, (history: OwnershipHistory) => history.pet)
  history!: OwnershipHistory[];

  @OneToMany(() => GPSLocationHistory, (gps: GPSLocationHistory) => gps.pet)
  gpsHistory!: GPSLocationHistory[];

  @OneToMany(() => QRScanLog, (log: QRScanLog) => log.pet)
  qrScans!: QRScanLog[];

  @OneToMany(() => PetTagOrder, (order: PetTagOrder) => order.pet)
  petTagOrders!: PetTagOrder[];

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', default: () => 'NOW()', onUpdate: 'NOW()' })
  updatedAt!: Date;
}

