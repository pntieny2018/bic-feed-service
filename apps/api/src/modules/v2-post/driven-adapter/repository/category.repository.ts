import { Op, WhereOptions } from 'sequelize';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CategoryModel, ICategory } from '../../../../database/models/category.model';
import { FindCategoryProps, ICategoryRepository } from '../../domain/repositoty-interface';
import { CategoryEntity } from '../../domain/model/category';
import { CATEGORY_FACTORY_TOKEN, ICategoryFactory } from '../../domain/factory/interface';

@Injectable()
export class CategoryRepository implements ICategoryRepository {
  public constructor(
    @InjectModel(CategoryModel)
    private readonly _categoryModel: typeof CategoryModel,
    @Inject(CATEGORY_FACTORY_TOKEN)
    private readonly _categoryFactory: ICategoryFactory
  ) {}

  public async count(options: FindCategoryProps): Promise<number> {
    const where = this._getCondition(options);
    return this._categoryModel.count({ where });
  }

  public async findAll(options: FindCategoryProps): Promise<CategoryEntity[]> {
    const where = this._getCondition(options);
    const rows = await this._categoryModel.findAll({ where });
    return rows.map((row) => this._categoryFactory.reconstitute(row));
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
