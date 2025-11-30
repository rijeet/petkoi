import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommunityService } from '../../APP.BLL/services/community.service';
import {
  CreateCommunityPostDto,
  UpdateCommunityPostDto,
  CreateCommentDto,
  GetPostsDto,
} from '../../APP.Shared/dtos/community.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('community')
export class CommunityController {
  constructor(private communityService: CommunityService) {}

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createPost(
    @Body() createPostDto: CreateCommunityPostDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.communityService.createPost(user.sub, createPostDto);
  }

  @Get('posts')
  @Public()
  async getPosts(@Query() query: GetPostsDto) {
    return this.communityService.getPosts(
      query.limit,
      query.offset,
      query.tag,
      query.authorId,
    );
  }

  @Get('posts/:id')
  @Public()
  async getPost(@Param('id') id: string) {
    return this.communityService.getPostById(id);
  }

  @Put('posts/:id')
  @UseGuards(JwtAuthGuard)
  async updatePost(
    @Param('id') id: string,
    @Body() updatePostDto: UpdateCommunityPostDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.communityService.updatePost(id, user.sub, updatePostDto);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    await this.communityService.deletePost(id, user.sub);
  }

  @Post('posts/:id/upvote')
  @Public()
  @HttpCode(HttpStatus.OK)
  async upvotePost(@Param('id') id: string) {
    return this.communityService.upvotePost(id);
  }

  @Post('posts/:id/downvote')
  @Public()
  @HttpCode(HttpStatus.OK)
  async downvotePost(@Param('id') id: string) {
    return this.communityService.downvotePost(id);
  }

  @Post('posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Param('id') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.communityService.createComment(postId, user.sub, createCommentDto);
  }

  @Get('posts/:id/comments')
  @Public()
  async getComments(
    @Param('id') postId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    return this.communityService.getComments(postId, limitNum, offsetNum);
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    await this.communityService.deleteComment(id, user.sub);
  }
}

