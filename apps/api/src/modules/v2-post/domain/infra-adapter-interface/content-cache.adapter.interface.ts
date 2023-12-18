import { ReactionsCount } from '@api/common/types';
import { ArticleEntity, PostEntity, SeriesEntity } from '@api/modules/v2-post/domain/model/content';

export interface IContentCacheAdapter {
  setJson<T>(key: string, value: T, path?: string): Promise<any>;
  setJsonNx<T>(key: string, value: T, path?: string): Promise<any>;
  increaseValue(key: string, path: string): Promise<void>;
  decreaseValue(key: string, path: string): Promise<number>;

  getJson<T>(key: string, path?: string): Promise<T>;
  mgetJson<T>(keys: string[]): Promise<T[]>;

  cacheContentReactionsCount(reactionsCountMap: Map<string, ReactionsCount>): Promise<void>;
  setCacheContents(contents: (PostEntity | ArticleEntity | SeriesEntity)[]): Promise<void>;
  deleteContentCache(contentId: string): Promise<void>;
}

export const CONTENT_CACHE_ADAPTER = 'CONTENT_CACHE_ADAPTER';
