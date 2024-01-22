import { RecentSearchModel } from '@libs/database/postgres/model';
import { Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { RecentSearchType } from '../../data-type/recent-search-type.enum';
import { RECENT_SEARCH_FACTORY_TOKEN } from '../../domain/factory/interface/recent-search.factory.interface';
import { RecentSearchFactory } from '../../domain/factory/recent-search.factory';
import { RecentSearchEntity } from '../../domain/model/recent-search/recent-search.entity';

import {
  DeleteRecentSearchOptions,
  FindRecentSearchOptions,
  IRecentSearchRepository,
} from './interface/recent-search.repository.interface';

export class RecentSearchRepository implements IRecentSearchRepository {
  @InjectModel(RecentSearchModel)
  private readonly _recentSearchModel: typeof RecentSearchModel;
  @Inject(RECENT_SEARCH_FACTORY_TOKEN)
  private readonly _recentSearchFactory: RecentSearchFactory;

  public async findOne(options: FindRecentSearchOptions): Promise<RecentSearchEntity> {
    const findOneOptions = {
      where: {},
    };
    if (options.id) {
      findOneOptions.where['id'] = options.id;
    }
    if (options.keyword) {
      findOneOptions.where['keyword'] = options.keyword;
    }
    if (options.target && options.target !== RecentSearchType.ALL) {
      findOneOptions.where['target'] = options.target;
    }
    if (options.userId) {
      findOneOptions.where['createdBy'] = options.userId;
    }
    const recentSearch = await this._recentSearchModel.findOne(findOneOptions);
    return this._modelToEntity(recentSearch);
  }
  public async create(data: RecentSearchEntity): Promise<void> {
    await this._recentSearchModel.create({
      id: data.get('id'),
      keyword: data.get('keyword'),
      target: data.get('target'),
      totalSearched: data.get('totalSearched'),
      createdBy: data.get('createdBy'),
      updatedBy: data.get('updatedBy'),
    });
  }
  public async update(data: RecentSearchEntity): Promise<void> {
    await this._recentSearchModel.update(
      {
        keyword: data.get('keyword'),
        target: data.get('target'),
        totalSearched: data.get('totalSearched'),
        createdBy: data.get('createdBy'),
        updatedBy: data.get('updatedBy'),
      },
      {
        where: { id: data.get('id') },
      }
    );
  }

  public async delete(options: DeleteRecentSearchOptions): Promise<void> {
    const deleteOptions = {
      where: {},
    };
    if (options.id) {
      deleteOptions.where['id'] = options.id;
    }
    if (options.keyword) {
      deleteOptions.where['keyword'] = options.keyword;
    }
    if (options.target && options.target !== RecentSearchType.ALL) {
      deleteOptions.where['target'] = options.target;
    }
    if (options.userId) {
      deleteOptions.where['createdBy'] = options.userId;
    }
    await this._recentSearchModel.destroy(deleteOptions);
  }

  private _modelToEntity(model: RecentSearchModel): RecentSearchEntity {
    if (!model) {
      return null;
    }
    return this._recentSearchFactory.reconstitute(model.toJSON());
  }
}
