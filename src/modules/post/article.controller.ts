import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { InternalEventEmitterService } from '../../app/custom/event-emitter';
import { APP_VERSION } from '../../common/constants';
import { PostHasBeenDeletedEvent, PostHasBeenPublishedEvent, PostHasBeenUpdatedEvent } from '../../events/post';
import { AuthUser, UserDto } from '../auth';
import { ArticleService } from './article.service';
import { GetPostPipe } from './pipes';
import { ArticleResponseDto } from './dto/responses/article.response.dto';
import { CreateArticleDto } from './dto/requests/create-article.dto';
import { UpdateArticleDto } from './dto/requests/update-article.dto';
import { GetArticleDto } from './dto/requests/get-article.dto';

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
    type: ArticleResponseDto,
  })
  @Get('/:articleId')
  public getArticle(
    @AuthUser(false) user: UserDto,
    @Param('articleId') articleId: string,
    @Query(GetPostPipe) getArticleDto: GetArticleDto
  ): Promise<ArticleResponseDto> {
    if (user === null) return this._articleService.getPublicArticle(articleId, getArticleDto);
    else return this._articleService.getArticle(articleId, user, getArticleDto);
  }

  @ApiOperation({ summary: 'Create article' })
  @ApiOkResponse({
    type: ArticleResponseDto,
    description: 'Create article successfully',
  })
  @Post('/')
  public async createArticle(
    @AuthUser() user: UserDto,
    @Body() createArticleDto: CreateArticleDto
  ): Promise<ArticleResponseDto> {
    const created = await this._articleService.createArticle(user, createArticleDto);
    if (created) {
      const article = await this._articleService.getArticle(created.id, user, new GetArticleDto());
      this._eventEmitter.emit(
        new PostHasBeenPublishedEvent({
          post: article,
          actor: user.profile,
        })
      );
      return article;
    }
  }

  @ApiOperation({ summary: 'Update article' })
  @ApiOkResponse({
    type: ArticleResponseDto,
    description: 'Update article successfully',
  })
  @Put('/:articleId')
  public async updateArticle(
    @AuthUser() user: UserDto,
    @Param('articleId') articleId: string,
    @Body() updateArticleDto: UpdateArticleDto
  ): Promise<ArticleResponseDto> {
    const articleBefore = await this._articleService.getArticle(
      articleId,
      user,
      new GetArticleDto()
    );
    const isUpdated = await this._articleService.updateArticle(
      articleBefore,
      user,
      updateArticleDto
    );
    if (isUpdated) {
      const articleUpdated = await this._articleService.getArticle(
        articleId,
        user,
        new GetArticleDto()
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
    @Param('id') articleId: string
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
