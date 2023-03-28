import { RecentSearchEntity, RecentSearchProps } from '../model/recent-search/recent-search.entity';
import { CreateRecentSearchOptions, IRecentSearchFactory } from './recent-search.factory.interface';
import { Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { v4 } from 'uuid';

export class RecentSearchFactory implements IRecentSearchFactory {
  @Inject(EventPublisher) private readonly _eventPublisher: EventPublisher;

  public create(props: CreateRecentSearchOptions): RecentSearchEntity {
    const { keyword, target, totalSearched, createdBy, updatedBy } = props;
    const now = new Date();
    const recentSearchEntity = new RecentSearchEntity({
      id: v4(),
      keyword,
      target,
      totalSearched,
      createdBy,
      updatedBy,
      createdAt: now,
      updatedAt: now,
    });
    return this._eventPublisher.mergeObjectContext(recentSearchEntity);
  }
  public reconstitute(props: RecentSearchProps): RecentSearchEntity {
    return new RecentSearchEntity(props);
  }
}
