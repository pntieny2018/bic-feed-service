import { PaginationResult } from '@libs/database/postgres/common';
import { Injectable } from '@nestjs/common';

import { CategoryEntity } from '../../domain/model/category';
import {
  FindCategoryProps,
  GetPaginationCategoryProps,
  ICategoryRepository,
} from '../../domain/repositoty-interface';
import { CategoryMapper } from '../mapper/category.mapper';
import { Op, WhereOptions } from 'sequelize';
import { CategoryAttributes } from '@libs/database/postgres/model/category.model';
import { LibCategoryRepository } from '@libs/database/postgres/repository/category.repository';

@Injectable()
export class CategoryRepository implements ICategoryRepository {
  public constructor(
    private readonly _libCategoryRepository: LibCategoryRepository,
    private readonly _categoryMapper: CategoryMapper
  ) {}

  public async getPagination(
    input: GetPaginationCategoryProps
  ): Promise<PaginationResult<CategoryEntity>> {
    const { offset, limit, name, level, createdBy } = input;
    const conditions: WhereOptions<CategoryAttributes> = {};
    if (name) {
      conditions.name = { [Op.iLike]: '%' + name + '%' };
    }
    if (level) {
      conditions.level = level;
    }
    if (createdBy) {
      conditions.createdBy = createdBy;
    }
    const { rows, count } = await this._libCategoryRepository.findAndCountAll({
      where: conditions,
      offset,
      limit,
      order: [['zindex', 'DESC']],
    });

    return {
      rows: rows.map((row) => this._categoryMapper.toDomain(row)),
      total: count,
    };
  }

  public async count(options: FindCategoryProps): Promise<number> {
    const whereOptions = this._getCondition(options);
    return this._libCategoryRepository.count({
      where: whereOptions,
    });
  }

  public async findAll(options: FindCategoryProps): Promise<CategoryEntity[]> {
    const whereOptions = this._getCondition(options);
    const categories = await this._libCategoryRepository.findMany({
      where: whereOptions,
    });
    return categories.map((category) => this._categoryMapper.toDomain(category));
  }

  private _getCondition(options: FindCategoryProps): WhereOptions<CategoryAttributes> {
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
