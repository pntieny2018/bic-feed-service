import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { InternalEventEmitterService } from '../../app/custom/event-emitter';
import { APP_VERSION } from '../../common/constants';
import { AuthUser, UserDto } from '../auth';
import { ArticleService } from './article.service';
import { ArticleResponseDto } from './dto/responses/article.response.dto';
import { CreateArticleDto } from './dto/requests/create-article.dto';
import { UpdateArticleDto } from './dto/requests/update-article.dto';
import { GetArticleDto } from './dto/requests/get-article.dto';
import { GetPostPipe } from '../post/pipes';
import { PageDto } from '../../common/dto';
import { SearchArticlesDto } from './dto/requests/search-article.dto';
import { GetListArticlesDto } from './dto/requests';
import {
  ArticleHasBeenDeletedEvent,
  ArticleHasBeenPublishedEvent,
  ArticleHasBeenUpdatedEvent,
} from '../../events/article';
import { InjectUserToBody } from '../../common/decorators/inject.decorator';
import { AuthorityService } from '../authority';
import { PostService } from '../post/post.service';
import { MentionService } from '../mention';

@ApiSecurity('authorization')
@ApiTags('Articles')
@Controller({
  version: APP_VERSION,
  path: 'articles',
})
export class ArticleController {
  public constructor(
    private _articleService: ArticleService,
    private _eventEmitter: InternalEventEmitterService,
    private _authorityService: AuthorityService,
    private _postService: PostService
  ) {}

  @ApiOperation({ summary: 'Search article' })
  @ApiOkResponse({
    type: ArticleResponseDto,
  })
  @Get('/search')
  public searchArticles(
    @AuthUser() user: UserDto,
    @Query() searchArticlesDto: SearchArticlesDto
  ): Promise<PageDto<ArticleResponseDto>> {
    return this._articleService.searchArticle(user, searchArticlesDto);
  }

  @ApiOperation({ summary: 'Get list article' })
  @ApiOkResponse({
    type: ArticleResponseDto,
  })
  @Get('/')
  public getList(
    @AuthUser() user: UserDto,
    @Query() getArticleListDto: GetListArticlesDto
  ): Promise<PageDto<ArticleResponseDto>> {
    return this._articleService.getList(user, getArticleListDto);
  }

  @ApiOperation({ summary: 'Get article detail' })
  @ApiOkResponse({
    type: ArticleResponseDto,
  })
  @Get('/:id')
  public getArticle(
    @AuthUser(false) user: UserDto,
    @Param('id', ParseUUIDPipe) articleId: string,
    @Query(GetPostPipe) getArticleDto: GetArticleDto
  ): Promise<ArticleResponseDto> {
    if (user === null) return this._articleService.getPublicArticle(articleId, getArticleDto);
    else {
      const article = this._articleService.getArticle(articleId, user, getArticleDto);
      return article;
    }
  }

  @ApiOperation({ summary: 'Create article' })
  @ApiOkResponse({
    type: ArticleResponseDto,
    description: 'Create article successfully',
  })
  @Post('/')
  @InjectUserToBody()
  public async createArticle(
    @AuthUser() user: UserDto,
    @Body() createArticleDto: CreateArticleDto
  ): Promise<ArticleResponseDto> {
    const { audience } = createArticleDto;
    const { groupIds } = audience;
    await this._authorityService.checkCanCreatePost(user, groupIds);

    const created = await this._articleService.createArticle(user, createArticleDto);
    if (created) {
      const article = await this._articleService.getArticle(created.id, user, new GetArticleDto());
      return article;
    }
  }

  @ApiOperation({ summary: 'Update view article' })
  @ApiOkResponse({
    type: Boolean,
    description: 'Update view article successfully',
  })
  @Put('/:id/update-view')
  public async updateView(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) articleId: string
  ): Promise<boolean> {
    return this._articleService.updateView(articleId, user);
  }

  @ApiOperation({ summary: 'Update article' })
  @ApiOkResponse({
    type: ArticleResponseDto,
    description: 'Update article successfully',
  })
  @Put('/:id')
  @InjectUserToBody()
  public async updateArticle(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) articleId: string,
    @Body() updateArticleDto: UpdateArticleDto
  ): Promise<ArticleResponseDto> {
    const { audience } = updateArticleDto;

    if (audience) {
      await this._authorityService.checkCanUpdatePost(user, audience.groupIds);
    }

    const articleBefore = await this._articleService.getArticle(
      articleId,
      user,
      new GetArticleDto()
    );

    if (articleBefore.isDraft === false) {
      await this._postService.checkContent(updateArticleDto);
    }
    await this._postService.checkPostOwner(articleBefore, user.id);

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
        new ArticleHasBeenUpdatedEvent({
          oldArticle: articleBefore,
          newArticle: articleUpdated,
          actor: user.profile,
        })
      );

      return articleUpdated;
    }
  }

  @ApiOperation({ summary: 'Publish article' })
  @ApiOkResponse({
    type: ArticleResponseDto,
    description: 'Publish article successfully',
  })
  @Put('/:id/publish')
  public async publishPost(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) articleId: string
  ): Promise<ArticleResponseDto> {
    const isPublished = await this._articleService.publishArticle(articleId, user);
    if (isPublished) {
      const article = await this._articleService.getArticle(articleId, user, new GetArticleDto());
      this._eventEmitter.emit(
        new ArticleHasBeenPublishedEvent({
          article,
          actor: user.profile,
        })
      );
      return article;
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
    @Param('id', ParseUUIDPipe) articleId: string
  ): Promise<boolean> {
    const articleDeleted = await this._articleService.deleteArticle(articleId, user);
    if (articleDeleted) {
      this._eventEmitter.emit(
        new ArticleHasBeenDeletedEvent({
          article: articleDeleted,
          actor: user.profile,
        })
      );
      return true;
    }
    return false;
  }
}
