import { RecentSearchEntity, RecentSearchProps } from '../model/recent-search/recent-search.entity';
import { IRecentSearchFactory } from './recent-search.factory.interface';

export class RecentSearchFactory implements IRecentSearchFactory {
  public reconstitute(props: RecentSearchProps): RecentSearchEntity {
    return new RecentSearchEntity(props);
  }
}
