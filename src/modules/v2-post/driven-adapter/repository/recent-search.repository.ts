import {
  FindRecentSearchOptions,
  IRecentSearchRepository,
} from '../../domain/repositoty-interface';
import { RecentSearchEntity } from '../../domain/model/recent-search/recent-search.entity';
import { InjectModel } from '@nestjs/sequelize';
import { RecentSearchModel } from '../../../../database/models/recent-search.model';
import { RecentSearchFactory } from '../../domain/factory';
import { Inject } from '@nestjs/common';

export class RecentSearchRepository implements IRecentSearchRepository {
  @InjectModel(RecentSearchModel)
  private readonly _recentSearchModel: typeof RecentSearchModel;
  @Inject(RecentSearchFactory)
  private readonly _recentSearchFactory: RecentSearchFactory;

  public async findOne(id: FindRecentSearchOptions): Promise<RecentSearchEntity> {
    const findOneOptions = {
      where: {},
    };
    if (id.id) {
      findOneOptions.where['id'] = id.id;
    }
    if (id.keyword) {
      findOneOptions.where['keyword'] = id.keyword;
    }
    if (id.target) {
      findOneOptions.where['target'] = id.target;
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

  public async delete(data: RecentSearchEntity): Promise<void> {
    await this._recentSearchModel.destroy({
      where: { id: data.get('id') },
    });
  }

  private _modelToEntity(model: RecentSearchModel): RecentSearchEntity {
    if (!model) return null;
    return this._recentSearchFactory.reconstitute(model.toJSON());
  }
}
