import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../APP.Infrastructure/prisma/prisma.service';
import { CreateCommunityPostDto, UpdateCommunityPostDto, CreateCommentDto } from '../../APP.Shared/dtos/community.dto';

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new community post
   */
  async createPost(authorId: string, data: CreateCommunityPostDto) {
    return this.prisma.communityPost.create({
      data: {
        authorId,
        title: data.title,
        body: data.body,
        imageUrl: data.imageUrl,
        location: data.location ? (data.location as any) : null,
        tags: data.tags || [],
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        comments: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get all posts with pagination and filters
   */
  async getPosts(limit: number = 20, offset: number = 0, tag?: string, authorId?: string) {
    const where: any = {};

    if (tag) {
      where.tags = {
        has: tag,
      };
    }

    if (authorId) {
      where.authorId = authorId;
    }

    const [posts, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          comments: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.communityPost.count({ where }),
    ]);

    return {
      posts,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get a single post by ID
   */
  async getPostById(postId: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  /**
   * Update a post (only by author)
   */
  async updatePost(postId: string, authorId: string, data: UpdateCommunityPostDto) {
    const post = await this.getPostById(postId);

    if (post.authorId !== authorId) {
      throw new ForbiddenException('You can only update your own posts');
    }

    return this.prisma.communityPost.update({
      where: { id: postId },
      data: {
        title: data.title,
        body: data.body,
        imageUrl: data.imageUrl,
        location: data.location ? (data.location as any) : undefined,
        tags: data.tags,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Delete a post (only by author)
   */
  async deletePost(postId: string, authorId: string) {
    const post = await this.getPostById(postId);

    if (post.authorId !== authorId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.communityPost.delete({
      where: { id: postId },
    });
  }

  /**
   * Upvote a post
   */
  async upvotePost(postId: string) {
    const post = await this.getPostById(postId);

    return this.prisma.communityPost.update({
      where: { id: postId },
      data: {
        upvotes: post.upvotes + 1,
      },
    });
  }

  /**
   * Downvote a post
   */
  async downvotePost(postId: string) {
    const post = await this.getPostById(postId);

    return this.prisma.communityPost.update({
      where: { id: postId },
      data: {
        downvotes: post.downvotes + 1,
      },
    });
  }

  /**
   * Create a comment on a post
   */
  async createComment(postId: string, authorId: string, data: CreateCommentDto) {
    // Verify post exists
    await this.getPostById(postId);

    // If parentId is provided, verify parent comment exists
    if (data.parentId) {
      const parentComment = await this.prisma.communityComment.findUnique({
        where: { id: data.parentId },
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }

      if (parentComment.postId !== postId) {
        throw new BadRequestException('Parent comment must belong to the same post');
      }
    }

    return this.prisma.communityComment.create({
      data: {
        postId,
        authorId,
        content: data.content,
        parentId: data.parentId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Get comments for a post
   */
  async getComments(postId: string, limit: number = 50, offset: number = 0) {
    await this.getPostById(postId); // Verify post exists

    const [comments, total] = await Promise.all([
      this.prisma.communityComment.findMany({
        where: { postId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.communityComment.count({
        where: { postId },
      }),
    ]);

    return {
      comments,
      total,
      limit,
      offset,
    };
  }

  /**
   * Delete a comment (only by author)
   */
  async deleteComment(commentId: string, authorId: string) {
    const comment = await this.prisma.communityComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== authorId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.communityComment.delete({
      where: { id: commentId },
    });
  }
}

