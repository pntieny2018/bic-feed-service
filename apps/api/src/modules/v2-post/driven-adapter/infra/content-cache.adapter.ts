import {
  CONTENT_BINDING_TOKEN,
  IContentBinding,
  IQuizBinding,
  QUIZ_BINDING_TOKEN,
} from '@api/modules/v2-post/application/binding';
import {
  ArticleCacheDto,
  PostCacheDto,
  ReactionCount,
  SeriesCacheDto,
} from '@api/modules/v2-post/application/dto';
import { IContentCacheAdapter } from '@api/modules/v2-post/domain/infra-adapter-interface';
import { QuizEntity } from '@api/modules/v2-post/domain/model/quiz';
import { CACHE_KEYS } from '@libs/common/constants';
import { RedisContentService } from '@libs/infra/redis/redis-content.service';
import { forwardRef, Inject, Injectable } from '@nestjs/common';

import { ArticleEntity, PostEntity, SeriesEntity } from '../../domain/model/content';

@Injectable()
export class ContentCacheAdapter implements IContentCacheAdapter {
  public constructor(
    private readonly _store: RedisContentService,
    @Inject(forwardRef(() => CONTENT_BINDING_TOKEN))
    private readonly _contentBinding: IContentBinding,
    @Inject(QUIZ_BINDING_TOKEN)
    private readonly _quizBinding: IQuizBinding
  ) {}

  public async setJson<T>(key: string, value: T, path?: string): Promise<any> {
    return this._store.setJson(key, value, path);
  }

  public async setJsonNx<T>(key: string, value: T, path = '$'): Promise<any> {
    return this._store.setJson(key, value, path, true);
  }

  public async increaseValue(key: string, path: string): Promise<number> {
    const redisClient = this._store.getClient();
    const increaseResult = await redisClient.call('JSON.NUMINCRBY', key, `$.${path}`, 1);
    return JSON.parse(increaseResult as string)[0];
  }

  public async decreaseValue(key: string, path: string, decrease = -1): Promise<number> {
    const redisClient = this._store.getClient();
    const decreaseResult = await redisClient.call('JSON.NUMINCRBY', key, `$.${path}`, decrease);
    return JSON.parse(decreaseResult as string)[0];
  }

  public async hasKey(key: string): Promise<boolean> {
    return this._store.existKey(key);
  }

  public async getJson<T>(key: string, path?: string): Promise<T> {
    return this._store.getJson(key, path);
  }

  public async mgetJson<T>(keys: string[]): Promise<T[]> {
    return this._store.mgetJson(keys);
  }

  public async getContentCached(
    contentId: string
  ): Promise<PostCacheDto | ArticleCacheDto | SeriesCacheDto> {
    const contentCache = await this.getJson<PostCacheDto | ArticleCacheDto | SeriesCacheDto>(
      `${CACHE_KEYS.CONTENT}:${contentId}`
    );

    if (!contentCache) {
      return null;
    }

    return contentCache;
  }

  public async getContentsCached(
    contentIds: string[]
  ): Promise<(PostCacheDto | ArticleCacheDto | SeriesCacheDto)[]> {
    return this.mgetJson<PostCacheDto | ArticleCacheDto | SeriesCacheDto>(
      contentIds.map((contentId) => `${CACHE_KEYS.CONTENT}:${contentId}`)
    );
  }

  public async setCacheContents(
    contents: (PostEntity | ArticleEntity | SeriesEntity)[]
  ): Promise<void> {
    if (!contents.length) {
      return;
    }

    const contentsCacheDto = await this._contentBinding.contentsCacheBinding(contents);
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

  public async deleteContentCache(contentId: string): Promise<void> {
    await this._store.del(`${CACHE_KEYS.CONTENT}:${contentId}`);
  }

  public async getUserReportedTargetIds(userId: string): Promise<string[]> {
    return this._store.getSets(`${CACHE_KEYS.USER_REPORTED_CONTENT}:${userId}`);
  }

  public async cacheUserReportedContent(userId: string, contentIds: string[]): Promise<void> {
    await this._store.setSets(`${CACHE_KEYS.USER_REPORTED_CONTENT}:${userId}`, contentIds);
  }

  public async setReactionsCount(contentId: string, reactionsCount: ReactionCount): Promise<void> {
    await this.setJson(`${CACHE_KEYS.CONTENT}:${contentId}`, reactionsCount, 'reactionsCount');
  }

  public async setReactionNameNx(contentId: string, reactionName: string): Promise<any> {
    await this.setJsonNx(`${CACHE_KEYS.CONTENT}:${contentId}`, 1, `reactionsCount.${reactionName}`);
  }

  public async increaseReactionsCount(contentId: string, reactionName: string): Promise<number> {
    return this.increaseValue(
      `${CACHE_KEYS.CONTENT}:${contentId}`,
      `reactionsCount.${reactionName}`
    );
  }

  public async decreaseReactionsCount(contentId: string, reactionName: string): Promise<number> {
    return this.decreaseValue(
      `${CACHE_KEYS.CONTENT}:${contentId}`,
      `reactionsCount.${reactionName}`
    );
  }

  public async increaseCommentCount(contentId: string): Promise<void> {
    await this.increaseValue(`${CACHE_KEYS.CONTENT}:${contentId}`, 'commentsCount');
  }

  public async decreaseCommentCount(contentId: string, decrease = -1): Promise<void> {
    await this.decreaseValue(`${CACHE_KEYS.CONTENT}:${contentId}`, 'commentsCount', decrease);
  }

  public async increaseSeenContentCount(contentId: string): Promise<void> {
    await this.increaseValue(`${CACHE_KEYS.CONTENT}:${contentId}`, 'totalUsersSeen');
  }

  public async updateQuiz(quiz: QuizEntity): Promise<void> {
    const contentId = quiz.get('contentId');
    const isContentCached = await this.hasKey(`${CACHE_KEYS.CONTENT}:${contentId}`);
    if (!isContentCached) {
      return;
    }

    const quizDto = this._quizBinding.binding(quiz);
    await this.setJson(`${CACHE_KEYS.CONTENT}:${contentId}`, quizDto, 'quiz');
  }

  public async deleteQuiz(contentId: string): Promise<void> {
    const isContentCached = await this.hasKey(`${CACHE_KEYS.CONTENT}:${contentId}`);
    if (!isContentCached) {
      return;
    }
    await this.setJson(`${CACHE_KEYS.CONTENT}:${contentId}`, null, 'quiz');
  }
}
