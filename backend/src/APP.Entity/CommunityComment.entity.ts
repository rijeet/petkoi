import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { CommunityPost } from './CommunityPost.entity';
import { User } from './User.entity';

@Entity('community_comments')
@Index(['postId'])
@Index(['authorId'])
export class CommunityComment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  postId!: string;

  @ManyToOne(() => CommunityPost, (post: CommunityPost) => post.comments, { onDelete: 'CASCADE' })
  post!: CommunityPost;

  @Column()
  authorId!: string;

  @ManyToOne(() => User, (user: User) => user.communityComments, { onDelete: 'CASCADE' })
  author!: User;

  @Column({ type: 'text' })
  content!: string;

  @Column({ nullable: true })
  parentId?: string;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  createdAt!: Date;
}

