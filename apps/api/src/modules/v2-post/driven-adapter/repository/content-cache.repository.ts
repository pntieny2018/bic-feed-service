import {
  ArticleCacheDto,
  PostCacheDto,
  ReactionCount,
  SeriesCacheDto,
} from '@api/modules/v2-post/application/dto';
import { QuizEntity } from '@api/modules/v2-post/domain/model/quiz';
import { IContentCacheRepository } from '@api/modules/v2-post/domain/repositoty-interface/content-cache.repository.interface';
import { ContentMapper, QuizMapper } from '@api/modules/v2-post/driven-adapter/mapper';
import { CACHE_KEYS } from '@libs/common/constants';
import { RedisContentService } from '@libs/infra/redis/redis-content.service';
import { Injectable } from '@nestjs/common';

import { ArticleEntity, PostEntity, SeriesEntity } from '../../domain/model/content';

@Injectable()
export class ContentCacheRepository implements IContentCacheRepository {
  public constructor(
    private readonly _store: RedisContentService,
    private readonly _contentMapper: ContentMapper,
    private readonly _quizMapper: QuizMapper
  ) {}

  public async existKey(key: string): Promise<boolean> {
    return this._store.existKey(key);
  }

  public async getContent(
    contentId: string
  ): Promise<PostCacheDto | ArticleCacheDto | SeriesCacheDto> {
    const contentCache = await this._store.getJson<PostCacheDto | ArticleCacheDto | SeriesCacheDto>(
      `${CACHE_KEYS.CONTENT}:${contentId}`
    );

    if (!contentCache) {
      return null;
    }

    return contentCache;
  }

  public async getContents(
    contentIds: string[]
  ): Promise<(PostCacheDto | ArticleCacheDto | SeriesCacheDto)[]> {
    return this._store.mgetJson<PostCacheDto | ArticleCacheDto | SeriesCacheDto>(
      contentIds.map((contentId) => `${CACHE_KEYS.CONTENT}:${contentId}`)
    );
  }

  public async setContents(contents: (PostEntity | ArticleEntity | SeriesEntity)[]): Promise<void> {
    if (!contents.length) {
      return;
    }

    const contentsCacheDto = await this._contentMapper.contentsCacheBinding(contents);
    const pipeline = this._store.getClient().pipeline();
    for (const contentCacheDto of contentsCacheDto) {
      pipeline.call(
        'JSON.SET',
        `${CACHE_KEYS.CONTENT}:${contentCacheDto.id}`,
        '$',
        JSON.stringify(contentCacheDto)
      );
    }
    await pipeline.exec();
  }

  public async deleteContent(contentId: string): Promise<void> {
    await this._store.del(`${CACHE_KEYS.CONTENT}:${contentId}`);
  }

  public async getReportedTargetIdsByUserId(userId: string): Promise<string[]> {
    return this._store.getSets(`${CACHE_KEYS.USER_REPORTED_CONTENT}:${userId}`);
  }

  public async cacheUserReportedContent(userId: string, contentIds: string[]): Promise<void> {
    await this._store.setSets(`${CACHE_KEYS.USER_REPORTED_CONTENT}:${userId}`, contentIds);
  }

  public async setReactionsCount(contentId: string, reactionsCount: ReactionCount): Promise<void> {
    await this._store.setJson(
      `${CACHE_KEYS.CONTENT}:${contentId}`,
      reactionsCount,
      'reactionsCount'
    );
  }

  public async setReactionNameNx(contentId: string, reactionName: string): Promise<any> {
    await this._store.setJson(
      `${CACHE_KEYS.CONTENT}:${contentId}`,
      1,
      `reactionsCount.${reactionName}`,
      true
    );
  }

  public async increaseReactionsCount(contentId: string, reactionName: string): Promise<number> {
    return this._store.increaseValue(
      `${CACHE_KEYS.CONTENT}:${contentId}`,
      `reactionsCount.${reactionName}`
    );
  }

  public async decreaseReactionsCount(contentId: string, reactionName: string): Promise<number> {
    return this._store.decreaseValue(
      `${CACHE_KEYS.CONTENT}:${contentId}`,
      `reactionsCount.${reactionName}`
    );
  }

  public async increaseCommentCount(contentId: string): Promise<void> {
    await this._store.increaseValue(`${CACHE_KEYS.CONTENT}:${contentId}`, 'commentsCount');
  }

  public async decreaseCommentCount(contentId: string, decrease = -1): Promise<void> {
    await this._store.decreaseValue(
      `${CACHE_KEYS.CONTENT}:${contentId}`,
      'commentsCount',
      decrease
    );
  }

  public async increaseSeenContentCount(contentId: string): Promise<void> {
    await this._store.increaseValue(`${CACHE_KEYS.CONTENT}:${contentId}`, 'totalUsersSeen');
  }

  public async updateQuiz(quiz: QuizEntity): Promise<void> {
    const contentId = quiz.get('contentId');
    const isContentCached = await this._store.existKey(`${CACHE_KEYS.CONTENT}:${contentId}`);
    if (!isContentCached) {
      return;
    }

    const quizDto = this._quizMapper.toDto(quiz);
    await this._store.setJson(`${CACHE_KEYS.CONTENT}:${contentId}`, quizDto, 'quiz');
  }

  public async deleteQuiz(contentId: string): Promise<void> {
    const isContentCached = await this._store.existKey(`${CACHE_KEYS.CONTENT}:${contentId}`);
    if (!isContentCached) {
      return;
    }
    await this._store.setJson(`${CACHE_KEYS.CONTENT}:${contentId}`, null, 'quiz');
  }
}
