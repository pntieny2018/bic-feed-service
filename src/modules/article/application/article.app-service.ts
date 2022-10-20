import { BadRequestException, Injectable } from '@nestjs/common';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import { PageDto } from '../../../common/dto';
import {
  ArticleHasBeenDeletedEvent,
  ArticleHasBeenPublishedEvent,
  ArticleHasBeenUpdatedEvent,
} from '../../../events/article';
import { UserDto } from '../../auth';
import { AuthorityService } from '../../authority';
import { PostService } from '../../post/post.service';
import { ArticleService } from '../article.service';
import { GetListArticlesDto } from '../dto/requests';
import { CreateArticleDto } from '../dto/requests/create-article.dto';
import { GetArticleDto } from '../dto/requests/get-article.dto';
import { GetDraftArticleDto } from '../dto/requests/get-draft-article.dto';
import { GetRelatedArticlesDto } from '../dto/requests/get-related-articles.dto';
import { UpdateArticleDto } from '../dto/requests/update-article.dto';
import { ArticleResponseDto } from '../dto/responses/article.response.dto';

@Injectable()
export class ArticleAppService {
  public constructor(
    private _articleService: ArticleService,
    private _eventEmitter: InternalEventEmitterService,
    private _authorityService: AuthorityService,
    private _postService: PostService
  ) {}

  public async getRelatedById(
    user: UserDto,
    getArticleListDto: GetRelatedArticlesDto
  ): Promise<PageDto<ArticleResponseDto>> {
    return this._articleService.getRelatedById(getArticleListDto, user);
  }

  public getDrafts(
    user: UserDto,
    getDraftDto: GetDraftArticleDto
  ): Promise<PageDto<ArticleResponseDto>> {
    return this._articleService.getDrafts(user.id, getDraftDto);
  }

  public getList(
    user: UserDto,
    getArticleListDto: GetListArticlesDto
  ): Promise<PageDto<ArticleResponseDto>> {
    return this._articleService.getList(user, getArticleListDto);
  }

  public get(
    user: UserDto,
    articleId: string,
    getArticleDto: GetArticleDto
  ): Promise<ArticleResponseDto> {
    return this._articleService.get(articleId, user, getArticleDto);
  }

  public async create(
    user: UserDto,
    createArticleDto: CreateArticleDto
  ): Promise<ArticleResponseDto> {
    const created = await this._articleService.create(user, createArticleDto);
    if (created) {
      const article = await this._articleService.get(created.id, user, new GetArticleDto());
      return article;
    }
  }

  public async updateView(user: UserDto, articleId: string): Promise<boolean> {
    return this._articleService.updateView(articleId, user);
  }

  public async update(
    user: UserDto,
    articleId: string,
    updateArticleDto: UpdateArticleDto
  ): Promise<ArticleResponseDto> {
    const { audience } = updateArticleDto;
    const articleBefore = await this._articleService.get(articleId, user, new GetArticleDto());
    if (articleBefore.isDraft === false && audience.groupIds.length === 0) {
      throw new BadRequestException('Audience is required');
    }

    await this._authorityService.checkCanUpdatePost(user, articleBefore, audience.groupIds);
    if (articleBefore.isDraft === false) {
      this._postService.checkContent(updateArticleDto.content, updateArticleDto.media);
    }
    await this._authorityService.checkPostOwner(articleBefore, user.id);

    const isUpdated = await this._articleService.update(articleBefore, user, updateArticleDto);
    if (isUpdated) {
      const articleUpdated = await this._articleService.get(articleId, user, new GetArticleDto());
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

  public async publish(user: UserDto, articleId: string): Promise<ArticleResponseDto> {
    const isPublished = await this._articleService.publish(articleId, user);
    if (isPublished) {
      const article = await this._articleService.get(articleId, user, new GetArticleDto());
      this._eventEmitter.emit(
        new ArticleHasBeenPublishedEvent({
          article,
          actor: user.profile,
        })
      );
      return article;
    }
  }

  public async delete(user: UserDto, articleId: string): Promise<boolean> {
    const articleDeleted = await this._articleService.delete(articleId, user);
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
