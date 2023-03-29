import { RecentSearchEntity } from '../model/recent-search/recent-search.entity';
import {
  IRecentSearchDomainService,
  RecentSearchCreateProps,
  RecentSearchDeleteProps,
  RecentSearchUpdateProps,
} from './interface';
import { Inject, Logger } from '@nestjs/common';
import { IRecentSearchFactory, RECENT_SEARCH_FACTORY_TOKEN } from '../factory';
import { IRecentSearchRepository, RECENT_SEARCH_REPOSITORY_TOKEN } from '../repositoty-interface';
import { DatabaseException } from '../../../../common/exceptions/database.exception';

export class RecentSearchDomainService implements IRecentSearchDomainService {
  private readonly _logger = new Logger(RecentSearchDomainService.name);
  @Inject(RECENT_SEARCH_REPOSITORY_TOKEN)
  private readonly _recentSearchRepository: IRecentSearchRepository;
  @Inject(RECENT_SEARCH_FACTORY_TOKEN)
  private readonly _recentSearchFactory: IRecentSearchFactory;
  public async createRecentSearch(data: RecentSearchCreateProps): Promise<RecentSearchEntity> {
    const { keyword, target, userId } = data;
    const recentSearchEntity = this._recentSearchFactory.create({
      keyword,
      target,
      totalSearched: 1,
      createdBy: userId,
      updatedBy: userId,
    });
    try {
      await this._recentSearchRepository.create(recentSearchEntity);
      recentSearchEntity.commit();
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
    return recentSearchEntity;
  }

  public async updateRecentSearch(
    entity: RecentSearchEntity,
    input: RecentSearchUpdateProps
  ): Promise<RecentSearchEntity> {
    const { userId } = input;
    entity.update({
      updatedBy: userId,
      totalSearched: entity.get('totalSearched') + 1,
    });
    if (entity.isChanged()) {
      try {
        await this._recentSearchRepository.update(entity);
        entity.commit();
      } catch (e) {
        this._logger.error(JSON.stringify(e?.stack));
        throw new DatabaseException();
      }
    }
    return entity;
  }

  public async deleteRecentSearch(props: RecentSearchDeleteProps): Promise<void> {
    try {
      await this._recentSearchRepository.delete(props);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
  }
}
