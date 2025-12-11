import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from './User.entity';
import { CommunityComment } from './CommunityComment.entity';

@Entity('community_posts')
@Index(['authorId'])
@Index(['createdAt'])
export class CommunityPost {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  authorId!: string;

  @ManyToOne(() => User, (user: User) => user.communityPosts, { onDelete: 'CASCADE' })
  author!: User;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  location?: Record<string, any>;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  tags!: string[];

  @Column({ type: 'int', default: 0 })
  upvotes!: number;

  @Column({ type: 'int', default: 0 })
  downvotes!: number;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  createdAt!: Date;

  @OneToMany(() => CommunityComment, (comment: CommunityComment) => comment.post)
  comments!: CommunityComment[];
}

