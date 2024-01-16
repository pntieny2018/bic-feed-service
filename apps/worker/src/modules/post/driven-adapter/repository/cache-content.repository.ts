import { CACHE_KEYS } from '@libs/common/constants';
import { RedisContentService } from '@libs/infra/redis/redis-content.service';
import { Injectable } from '@nestjs/common';

import { ICacheContentRepository } from '../../domain/repositoty-interface';

@Injectable()
export class CacheContentRepository implements ICacheContentRepository {
  public constructor(private readonly _store: RedisContentService) {}

  public async deleteContents(contentIds: string[]): Promise<void> {
    if (!contentIds?.length) {
      return;
    }
    const pipeline = this._store.getClient().pipeline();
    for (const contentId of contentIds) {
      pipeline.call('DEL', `${CACHE_KEYS.CONTENT}:${contentId}`);
    }
    await pipeline.exec();
  }
}
