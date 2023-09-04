import {
  ILibCategoryRepository,
  LIB_CATEGORY_REPOSITORY_TOKEN,
} from '@libs/database/postgres/repository/interface';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';

import { PaginationResult } from '../../../../common/types';
import { CategoryModel, ICategory } from '../../../../database/models/category.model';
import { CATEGORY_FACTORY_TOKEN, ICategoryFactory } from '../../domain/factory/interface';
import { CategoryEntity } from '../../domain/model/category';
import {
  FindCategoryProps,
  GetPaginationCategoryProps,
  ICategoryRepository,
} from '../../domain/repositoty-interface';
import { CategoryMapper } from '../mapper/category.mapper';

@Injectable()
export class CategoryRepository implements ICategoryRepository {
  public constructor(
    @InjectModel(CategoryModel)
    private readonly _categoryModel: typeof CategoryModel,
    @Inject(LIB_CATEGORY_REPOSITORY_TOKEN)
    private readonly _libCategoryRepository: ILibCategoryRepository,
    @Inject(CATEGORY_FACTORY_TOKEN) private readonly _factory: ICategoryFactory,
    private readonly _categoryMapper: CategoryMapper
  ) {}

  public async getPagination(
    input: GetPaginationCategoryProps
  ): Promise<PaginationResult<CategoryEntity>> {
    const { offset, limit, name, level, createdBy } = input;
    const conditions = {};
    if (name) {
      conditions['name'] = { [Op.iLike]: '%' + name + '%' };
    }
    if (level) {
      conditions['level'] = level;
    }
    if (createdBy) {
      conditions['createdBy'] = createdBy;
    }
    const { rows, count } = await this._categoryModel.findAndCountAll({
      where: conditions,
      offset,
      limit,
      order: [['zindex', 'DESC']],
    });
    const result = rows.map((row) => this._factory.reconstitute(row));

    return {
      rows: result,
      total: count,
    };
  }

  public async count(options: FindCategoryProps): Promise<number> {
    const where = this._getCondition(options);
    return this._categoryModel.count({ where });
  }

  public async findAll(options: FindCategoryProps): Promise<CategoryEntity[]> {
    const categories = await this._libCategoryRepository.findAll(options);
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
