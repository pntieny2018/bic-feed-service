import { PaginationResult } from '@libs/database/postgres/common';
import { CategoryAttributes, CategoryModel } from '@libs/database/postgres/model/category.model';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';

import {
  FindCategoryOptions,
  GetPaginationCategoryProps,
  ILibCategoryRepository,
} from './interface';

@Injectable()
export class LibCategoryRepository implements ILibCategoryRepository {
  public constructor(
    @InjectModel(CategoryModel) private readonly _categoryModel: typeof CategoryModel
  ) {}

  public async getPagination(
    input: GetPaginationCategoryProps
  ): Promise<PaginationResult<CategoryModel>> {
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

    return {
      rows,
      total: count,
    };
  }

  public async count(options: FindCategoryOptions): Promise<number> {
    const where = this._getCondition(options);
    return this._categoryModel.count({ where });
  }

  public async findAll(options: FindCategoryOptions): Promise<CategoryModel[]> {
    const where = this._getCondition(options);
    return await this._categoryModel.findAll({ where });
  }

  private _getCondition(options: FindCategoryOptions): WhereOptions<CategoryAttributes> {
    let whereOptions: WhereOptions<CategoryAttributes> = {};
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
