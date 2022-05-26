import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { InternalEventEmitterService } from '../../app/custom/event-emitter';
import { APP_VERSION } from '../../common/constants';
import {
  PostHasBeenDeletedEvent,
  PostHasBeenPublishedEvent,
  PostHasBeenUpdatedEvent,
} from '../../events/post';
import { AuthUser, UserDto } from '../auth';
import { CreatePostDto, GetPostDto, UpdatePostDto } from './dto/requests';
import { PostResponseDto } from './dto/responses';
import { ArticleService } from './article.service';
import { GetPostPipe } from './pipes';

@ApiSecurity('authorization')
@ApiTags('Articles')
@Controller({
  version: APP_VERSION,
  path: 'articles',
})
export class ArticleController {
  public constructor(
    private _articleService: ArticleService,
    private _eventEmitter: InternalEventEmitterService
  ) {}

  @ApiOperation({ summary: 'Get article detail' })
  @ApiOkResponse({
    type: PostResponseDto,
  })
  @Get('/:articleId')
  public getPost(
    @AuthUser(false) user: UserDto,
    @Param('articleId', ParseIntPipe) articleId: number,
    @Query(GetPostPipe) getPostDto: GetPostDto
  ): Promise<PostResponseDto> {
    if (user === null) return this._articleService.getPublicArticle(articleId, getPostDto);
    else return this._articleService.getArticle(articleId, user, getPostDto);
  }

  @ApiOperation({ summary: 'Create article' })
  @ApiOkResponse({
    type: PostResponseDto,
    description: 'Create article successfully',
  })
  @Post('/')
  public async createPost(
    @AuthUser() user: UserDto,
    @Body() createPostDto: CreatePostDto
  ): Promise<PostResponseDto> {
    const created = await this._articleService.createPost(user, createPostDto);
    if (created) {
      return await this._articleService.getArticle(created.id, user, new GetPostDto());
    }
  }

  @ApiOperation({ summary: 'Update article' })
  @ApiOkResponse({
    type: PostResponseDto,
    description: 'Update article successfully',
  })
  @Put('/:articleId')
  public async updatePost(
    @AuthUser() user: UserDto,
    @Param('articleId', ParseIntPipe) articleId: number,
    @Body() updatePostDto: UpdatePostDto
  ): Promise<PostResponseDto> {
    const articleBefore = await this._articleService.getArticle(articleId, user, new GetPostDto());
    const isUpdated = await this._articleService.updateArticle(articleBefore, user, updatePostDto);
    if (isUpdated) {
      const articleUpdated = await this._articleService.getArticle(
        articleId,
        user,
        new GetPostDto()
      );
      this._eventEmitter.emit(
        new PostHasBeenUpdatedEvent({
          oldPost: articleBefore,
          newPost: articleUpdated,
          actor: user.profile,
        })
      );

      return articleUpdated;
    }
  }

  @ApiOperation({ summary: 'Delete article' })
  @ApiOkResponse({
    type: Boolean,
    description: 'Delete article successfully',
  })
  @Delete('/:id')
  public async deleteArticle(
    @AuthUser() user: UserDto,
    @Param('id', ParseIntPipe) articleId: number
  ): Promise<boolean> {
    const articleDeleted = await this._articleService.deleteArticle(articleId, user);
    if (articleDeleted) {
      this._eventEmitter.emit(
        new PostHasBeenDeletedEvent({
          post: articleDeleted,
          actor: user.profile,
        })
      );
      return true;
    }
    return false;
  }
}
