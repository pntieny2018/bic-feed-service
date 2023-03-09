import {
  GetPaginationCategoryProps,
  ICategoryQuery,
} from '../../domain/query-interface/category.query.interface';
import { PaginationResult } from '../../../../common/types/pagination-result.type';
import { CategoryEntity } from '../../domain/model/category';
import {
  CATEGORY_FACTORY_TOKEN,
  ICategoryFactory,
} from '../../domain/factory/category.factory.interface';
import { Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CategoryModel } from '../../../../database/models/category.model';
import { Op } from 'sequelize';

export class CategoryQuery implements ICategoryQuery {
  @Inject(CATEGORY_FACTORY_TOKEN) private readonly _factory: ICategoryFactory;
  @InjectModel(CategoryModel) private readonly _categoryModel: typeof CategoryModel;
  public async getPagination(
    input: GetPaginationCategoryProps
  ): Promise<PaginationResult<CategoryEntity>> {
    const { offset, limit, name, level, isCreatedByMe, userId } = input;
    const conditions = {};
    if (name) {
      conditions['name'] = { [Op.iLike]: '%' + name };
    }
    if (level) {
      conditions['level'] = level;
    }
    if (isCreatedByMe && userId) {
      conditions['createdBy'] = userId;
    }
    const { rows, count } = await this._categoryModel.findAndCountAll({
      where: conditions,
      offset,
      limit,
      order: [
        ['totalUsed', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });
    const result = rows.map((row) => this._factory.reconstitute(row));

    return {
      rows: result,
      total: count,
    };
  }
}
