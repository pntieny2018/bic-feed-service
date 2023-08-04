import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ArrayHelper } from '../../common/helpers';
import { Transaction } from 'sequelize';
import { PostCategoryModel } from '../../database/models/post-category.model';

@Injectable()
export class CategoryService {
  public constructor(
    @InjectModel(PostCategoryModel)
    private _postCategoryModel: typeof PostCategoryModel
  ) {}

  public async updateToPost(
    categoryIds: string[],
    postId: string,
    transaction: Transaction
  ): Promise<void> {
    const currentCategories = await this._postCategoryModel.findAll({
      where: { postId },
    });
    const currentCategoryIds = currentCategories.map((i) => i.categoryId);

    const deleteCategoryIds = ArrayHelper.arrDifferenceElements(currentCategoryIds, categoryIds);
    if (deleteCategoryIds.length) {
      await this._postCategoryModel.destroy({
        where: { categoryId: deleteCategoryIds, postId },
        transaction,
      });
    }

    const addCategoryIds = ArrayHelper.arrDifferenceElements(categoryIds, currentCategoryIds);
    if (addCategoryIds.length) {
      await this._postCategoryModel.bulkCreate(
        addCategoryIds.map((categoryId) => ({
          postId,
          categoryId,
        })),
        { transaction }
      );
    }
  }
}
