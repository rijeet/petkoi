import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CommunityService } from './community.service';
import { PrismaService } from '../../APP.Infrastructure/prisma/prisma.service';

describe('CommunityService', () => {
  let service: CommunityService;
  let prisma: PrismaService;

  const mockPrismaService = {
    communityPost: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    communityComment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CommunityService>(CommunityService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    it('should create a new post', async () => {
      const createDto = {
        title: 'Test Post',
        body: 'Test body',
        tags: ['test'],
      };

      const createdPost = {
        id: 'post-1',
        authorId: 'user-1',
        ...createDto,
        upvotes: 0,
        downvotes: 0,
        createdAt: new Date(),
        author: { id: 'user-1', name: 'Test User' },
        comments: [],
      };

      mockPrismaService.communityPost.create.mockResolvedValue(createdPost);

      const result = await service.createPost('user-1', createDto);

      expect(mockPrismaService.communityPost.create).toHaveBeenCalledWith({
        data: {
          authorId: 'user-1',
          title: createDto.title,
          body: createDto.body,
          tags: createDto.tags,
          imageUrl: undefined,
          location: null,
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(createdPost);
    });
  });

  describe('getPostById', () => {
    it('should return a post by id', async () => {
      const post = {
        id: 'post-1',
        title: 'Test Post',
        comments: [],
      };

      mockPrismaService.communityPost.findUnique.mockResolvedValue(post);

      const result = await service.getPostById('post-1');

      expect(result).toEqual(post);
    });

    it('should throw NotFoundException if post not found', async () => {
      mockPrismaService.communityPost.findUnique.mockResolvedValue(null);

      await expect(service.getPostById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePost', () => {
    it('should update post if user is author', async () => {
      const post = {
        id: 'post-1',
        authorId: 'user-1',
        title: 'Old Title',
      };

      const updateDto = {
        title: 'New Title',
      };

      const updatedPost = {
        ...post,
        ...updateDto,
      };

      mockPrismaService.communityPost.findUnique.mockResolvedValue(post);
      mockPrismaService.communityPost.update.mockResolvedValue(updatedPost);

      const result = await service.updatePost('post-1', 'user-1', updateDto);

      expect(mockPrismaService.communityPost.update).toHaveBeenCalled();
      expect(result.title).toBe('New Title');
    });

    it('should throw ForbiddenException if user is not author', async () => {
      const post = {
        id: 'post-1',
        authorId: 'user-1',
      };

      mockPrismaService.communityPost.findUnique.mockResolvedValue(post);

      await expect(service.updatePost('post-1', 'user-2', { title: 'New' })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('createComment', () => {
    it('should create a comment on a post', async () => {
      const post = {
        id: 'post-1',
      };

      const commentDto = {
        content: 'Test comment',
      };

      const createdComment = {
        id: 'comment-1',
        postId: 'post-1',
        authorId: 'user-1',
        ...commentDto,
        createdAt: new Date(),
        author: { id: 'user-1', name: 'Test User' },
      };

      mockPrismaService.communityPost.findUnique.mockResolvedValue(post);
      mockPrismaService.communityComment.create.mockResolvedValue(createdComment);

      const result = await service.createComment('post-1', 'user-1', commentDto);

      expect(mockPrismaService.communityComment.create).toHaveBeenCalled();
      expect(result).toEqual(createdComment);
    });

    it('should throw BadRequestException if parent comment belongs to different post', async () => {
      const post = {
        id: 'post-1',
      };

      const parentComment = {
        id: 'parent-1',
        postId: 'post-2',
      };

      mockPrismaService.communityPost.findUnique.mockResolvedValue(post);
      mockPrismaService.communityComment.findUnique.mockResolvedValue(parentComment);

      await expect(
        service.createComment('post-1', 'user-1', { content: 'Test', parentId: 'parent-1' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

