import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreateCommentDto, CreatePostDto } from '../dto/create-post.dto';
import { PostsService } from '../services/posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get('health')
  health() {
    return this.postsService.health();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: { id: string }, @Body() body: CreatePostDto) {
    return this.postsService.create(user.id, body);
  }

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  feed(@CurrentUser() user: { id: string }, @Query('take') take?: string) {
    return this.postsService.listFeed(user.id, take ? Number(take) : 30);
  }

  @Get('by/:authorId')
  @UseGuards(JwtAuthGuard)
  byAuthor(
    @CurrentUser() user: { id: string },
    @Param('authorId', ParseUUIDPipe) authorId: string,
    @Query('take') take?: string,
  ) {
    return this.postsService.listByAuthor(authorId, user.id, take ? Number(take) : 40);
  }

  @Post(':id/unlock')
  @UseGuards(JwtAuthGuard)
  unlock(@CurrentUser() user: { id: string }, @Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.unlock(user.id, id);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  like(@CurrentUser() user: { id: string }, @Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.toggleLike(user.id, id);
  }

  @Get(':id/comments')
  @UseGuards(JwtAuthGuard)
  comments(@Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.listComments(id);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  addComment(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateCommentDto,
  ) {
    return this.postsService.addComment(user.id, id, body);
  }
}
