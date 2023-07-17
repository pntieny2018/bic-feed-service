import { Inject, Injectable } from '@nestjs/common';
import { ICategoryValidator } from './interface';
import { CATEGORY_REPOSITORY_TOKEN, ICategoryRepository } from '../repositoty-interface';
import { CategoryInvalidException } from '../exception';

@Injectable()
export class CategoryValidator implements ICategoryValidator {
  public constructor(
    @Inject(CATEGORY_REPOSITORY_TOKEN)
    protected readonly _categoryRepository: ICategoryRepository
  ) {}

  public async checkValidCategories(categoryIds: string[], createdBy: string): Promise<void> {
    const categoryCount = await this._categoryRepository.count({
      where: {
        ids: categoryIds,
        createdBy,
        shouldDisjunctionLevel: true,
      },
    });

    if (categoryCount < categoryIds.length) {
      throw new CategoryInvalidException();
    }
  }
}
