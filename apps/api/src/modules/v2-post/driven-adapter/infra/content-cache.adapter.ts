import { ReactionsCount } from '@api/common/types';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '@api/modules/v2-post/application/binding';
import { IContentCacheAdapter } from '@api/modules/v2-post/domain/infra-adapter-interface';
import { RedisContentService } from '@libs/infra/redis/redis-content.service';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { merge } from 'lodash';

import { ArticleEntity, PostEntity, SeriesEntity } from '../../domain/model/content';

@Injectable()
export class ContentCacheAdapter implements IContentCacheAdapter {
  public constructor(
    private readonly _store: RedisContentService,
    @Inject(forwardRef(() => CONTENT_BINDING_TOKEN))
    private readonly _contentBinding: IContentBinding
  ) {}

  public async setJson<T>(key: string, value: T, path?: string): Promise<any> {
    return this._store.setJson(key, value, path);
  }

  public async setJsonNx<T>(key: string, value: T, path = '$'): Promise<any> {
    return this._store.setJson(key, value, path, true);
  }

  public async increaseValue(key: string, path: string): Promise<void> {
    const redisClient = this._store.getClient();
    await redisClient.call('JSON.NUMINCRBY', key, `$.${path}`, 1);
  }

  public async decreaseValue(key: string, path: string): Promise<number> {
    const redisClient = this._store.getClient();
    const decreaseResult = await redisClient.call('JSON.NUMINCRBY', key, `$.${path}`, -1);
    return JSON.parse(decreaseResult as string)[0];
  }

  public async getJson<T>(key: string, path?: string): Promise<T> {
    return this._store.getJson(key, path);
  }

  public async mgetJson<T>(keys: string[]): Promise<T[]> {
    return this._store.mgetJson(keys);
  }

  public async cacheContentReactionsCount(
    reactionsCountMap: Map<string, ReactionsCount>
  ): Promise<void> {
    const redisClient = this._store.getClient();
    const pipeline = redisClient.pipeline();
    for (const [contentId, reactionsCount] of reactionsCountMap.entries()) {
      pipeline.call(
        'JSON.SET',
        contentId,
        '$',
        JSON.stringify({ id: contentId, reactionCounts: merge({}, ...reactionsCount) }),
        'NX'
      );
    }
    await pipeline.exec();
  }

  public async setCacheContents(
    contents: (PostEntity | ArticleEntity | SeriesEntity)[]
  ): Promise<void> {
    const contentsCacheDto = await this._contentBinding.contentsCacheBinding(contents);
    const pipeline = this._store.getClient().pipeline();
    for (const contentCacheDto of contentsCacheDto) {
      pipeline.call('JSON.SET', contentCacheDto.id, '$', JSON.stringify(contentCacheDto));
    }
    await pipeline.exec();
  }

  public async deleteContentCache(contentId: string): Promise<void> {
    await this._store.del(contentId);
  }
}
