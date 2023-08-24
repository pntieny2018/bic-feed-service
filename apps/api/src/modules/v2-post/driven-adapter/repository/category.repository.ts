import {
  ILibCategoryQuery,
  LIB_CATEGORY_QUERY_TOKEN,
} from '@libs/database/postgres/query/interface';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';

import { CategoryModel, ICategory } from '../../../../database/models/category.model';
import { CategoryEntity } from '../../domain/model/category';
import { FindCategoryProps, ICategoryRepository } from '../../domain/repositoty-interface';
import { CategoryMapper } from '../mapper/category.mapper';

@Injectable()
export class CategoryRepository implements ICategoryRepository {
  public constructor(
    @InjectModel(CategoryModel)
    private readonly _categoryModel: typeof CategoryModel,
    @Inject(LIB_CATEGORY_QUERY_TOKEN)
    private readonly _libCategoryQuery: ILibCategoryQuery,
    private readonly _categoryMapper: CategoryMapper
  ) {}

  public async count(options: FindCategoryProps): Promise<number> {
    const where = this._getCondition(options);
    return this._categoryModel.count({ where });
  }

  public async findAll(options: FindCategoryProps): Promise<CategoryEntity[]> {
    const categories = await this._libCategoryQuery.findAll(options);
    return categories.map((category) => this._categoryMapper.toDomain(category));
  }

  private _getCondition(options: FindCategoryProps): WhereOptions<ICategory> {
    let whereOptions: WhereOptions<ICategory> = {};
    if (options.where) {
      if (options.where['id']) {
        whereOptions.id = options.where['id'];
      } else if (options.where['ids']) {
        whereOptions.id = options.where['ids'];
      }

      if (options.where['createdBy']) {
        if (options.where['shouldDisjunctionLevel']) {
          whereOptions = {
            ...whereOptions,
            [Op.or]: {
              level: 1,
              createdBy: options.where['createdBy'],
            },
          };
        } else {
          whereOptions.createdBy = options.where['createdBy'];
        }
      }
    }
    return whereOptions;
  }
}
