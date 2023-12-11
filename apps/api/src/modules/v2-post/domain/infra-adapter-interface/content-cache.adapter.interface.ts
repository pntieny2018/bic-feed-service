import { ReactionsCount } from '@api/common/types';

export interface IContentCacheAdapter {
  setJson<T>(key: string, value: T): Promise<any>;
  setJsonNx<T>(key: string, value: T, path?: string): Promise<any>;
  increaseValue(key: string, path: string): Promise<void>;
  decreaseValue(key: string, path: string): Promise<void>;

  getJson<T>(key: string, path?: string): Promise<T>;
  mgetJson<T>(keys: string[]): Promise<T[]>;

  cacheContentReactionsCount(reactionsCountMap: Map<string, ReactionsCount>): Promise<void>;
  deleteContentCache(contentId: string): Promise<void>;
}

export const CONTENT_CACHE_ADAPTER = 'CONTENT_CACHE_ADAPTER';
