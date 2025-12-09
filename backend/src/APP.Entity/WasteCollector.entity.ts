import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('waste_collectors')
export class WasteCollector {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  phone!: string;

  @Column()
  ward!: string;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  createdAt!: Date;
}

