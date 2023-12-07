import { ReactionsCount } from '@api/common/types';

export interface ICacheAdapter {
  setJson<T>(key: string, value: T): Promise<any>;
  setJsonNx<T>(key: string, value: T, path?: string): Promise<any>;
  increaseValue(key: string, path: string): Promise<any>;
  decreaseValue(key: string, path: string): Promise<any>;

  getJson<T>(key: string, path?: string): Promise<T>;
  mgetJson<T>(keys: string[]): Promise<T[]>;
  cacheContentReactionsCount(reactionsCountMap: Map<string, ReactionsCount>): Promise<void>;
}

export const CACHE_ADAPTER = 'CACHE_ADAPTER';
