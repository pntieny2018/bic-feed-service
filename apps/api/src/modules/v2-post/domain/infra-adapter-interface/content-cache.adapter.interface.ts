import {
  ArticleCacheDto,
  PostCacheDto,
  ReactionCount,
  SeriesCacheDto,
} from '@api/modules/v2-post/application/dto';
import { ArticleEntity, PostEntity, SeriesEntity } from '@api/modules/v2-post/domain/model/content';

export interface IContentCacheAdapter {
  setJson<T>(key: string, value: T, path?: string): Promise<any>;
  setJsonNx<T>(key: string, value: T, path?: string): Promise<any>;
  increaseValue(key: string, path: string): Promise<void>;
  decreaseValue(key: string, path: string): Promise<number>;
  hasKey(key: string): Promise<boolean>;

  getJson<T>(key: string, path?: string): Promise<T>;
  mgetJson<T>(keys: string[]): Promise<T[]>;

  getContentCached(contentId: string): Promise<PostCacheDto | ArticleCacheDto | SeriesCacheDto>;
  getContentsCached(
    contentIds: string[]
  ): Promise<(PostCacheDto | ArticleCacheDto | SeriesCacheDto)[]>;
  setCacheContents(contents: (PostEntity | ArticleEntity | SeriesEntity)[]): Promise<void>;
  deleteContentCache(contentId: string): Promise<void>;

  getUserReportedTargetIds(userId: string): Promise<string[]>;
  cacheUserReportedContent(userId: string, contentIds: string[]): Promise<void>;

  setReactionsCount(contentId: string, reactionsCount: ReactionCount): Promise<void>;
  setReactionNameNx(contentId: string, reactionName: string): Promise<any>;
  increaseReactionsCount(contentId: string, reactionName: string): Promise<any>;
  decreaseReactionsCount(contentId: string, reactionName: string): Promise<any>;
}

export const CONTENT_CACHE_ADAPTER = 'CONTENT_CACHE_ADAPTER';
