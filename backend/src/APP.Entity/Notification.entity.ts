import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { User } from './User.entity';
import { NotificationType } from './enums';

@Entity('notifications')
@Index(['userId'])
@Index(['read'])
@Index(['createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => User, (user: User) => user.notifications, { onDelete: 'CASCADE' })
  user!: User;

  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @Column({ type: 'jsonb' })
  payload!: Record<string, any>;

  @Column({ default: false })
  read!: boolean;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  createdAt!: Date;
}

