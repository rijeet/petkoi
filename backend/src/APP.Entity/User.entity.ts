import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
} from 'typeorm';
import { Role } from './enums';
import { Pet } from './Pet.entity';
import { OwnershipHistory } from './OwnershipHistory.entity';
import { Notification } from './Notification.entity';
import { CommunityPost } from './CommunityPost.entity';
import { CommunityComment } from './CommunityComment.entity';
import { PetTagOrder } from './PetTagOrder.entity';
import { UserSession } from './UserSession.entity';

@Entity('users')
@Index(['geohash'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  profilePicture?: string;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role!: Role;

  @Column({ unique: true, nullable: true })
  googleId?: string;

  @Column({ type: 'double precision', nullable: true })
  latitude?: number;

  @Column({ type: 'double precision', nullable: true })
  longitude?: number;

  @Column({ nullable: true })
  geohash?: string;

  @Column({ nullable: true, type: 'text' })
  address?: string;

  @Column({ nullable: true, type: 'text' })
  homeAddress?: string;

  @Column({ nullable: true, type: 'text' })
  addressLine?: string;

  @Column({ nullable: true, type: 'text' })
  landmark?: string;

  @Column({ nullable: true, type: 'text' })
  zone?: string;

  @Column({ nullable: true, type: 'text' })
  city?: string;

  @Column({ nullable: true, type: 'text' })
  district?: string;

  @Column({ nullable: true, type: 'text' })
  postalCode?: string;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', default: () => 'NOW()', onUpdate: 'NOW()' })
  updatedAt!: Date;

  @OneToMany(() => Pet, (pet: Pet) => pet.owner)
  pets!: Pet[];

  @OneToMany(() => OwnershipHistory, (history: OwnershipHistory) => history.previousOwner)
  previousOwnershipHistory!: OwnershipHistory[];

  @OneToMany(() => OwnershipHistory, (history: OwnershipHistory) => history.newOwner)
  newOwnershipHistory!: OwnershipHistory[];

  @OneToMany(() => Notification, (notification: Notification) => notification.user)
  notifications!: Notification[];

  @OneToMany(() => CommunityPost, (post: CommunityPost) => post.author)
  communityPosts!: CommunityPost[];

  @OneToMany(() => CommunityComment, (comment: CommunityComment) => comment.author)
  communityComments!: CommunityComment[];

  @OneToMany(() => PetTagOrder, (order: PetTagOrder) => order.user)
  petTagOrders!: PetTagOrder[];

  @OneToMany(() => UserSession, (session: UserSession) => session.user)
  sessions!: UserSession[];

  // manual payments via Prisma only; no TypeORM relation needed here
}

