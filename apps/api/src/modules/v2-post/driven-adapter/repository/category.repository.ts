import { Op, WhereOptions } from 'sequelize';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CategoryModel, ICategory } from '../../../../database/models/category.model';
import { FindOneCategoryOptions, ICategoryRepository } from '../../domain/repositoty-interface';

@Injectable()
export class CategoryRepository implements ICategoryRepository {
  public constructor(
    @InjectModel(CategoryModel)
    private readonly _categoryModel: typeof CategoryModel
  ) {}

  public async count(options: FindOneCategoryOptions): Promise<number> {
    const where = this._getCondition(options);
    return this._categoryModel.count({ where });
  }

  private _getCondition(options: FindOneCategoryOptions): WhereOptions<ICategory> {
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
