import { Injectable } from '@nestjs/common';
import { CategoryResponseDto } from './dto/responses/category-response.dto';
import { CreateCategoryDto } from './dto/requests/create-category.dto';
import { InjectModel } from '@nestjs/sequelize';
import { CategoryModel } from '../../database/models/category.model';
import { NIL as NIL_UUID } from 'uuid';
import { ExceptionHelper } from '../../common/helpers';
import { HTTP_STATUS_ID } from '../../common/constants';
import { UserDto } from '../auth';

@Injectable()
export class CategoryService {
  public constructor(@InjectModel(CategoryModel) private _categoryModel: typeof CategoryModel) {}

  public async createCategory(
    user: UserDto,
    createCategoryDto: CreateCategoryDto
  ): Promise<CategoryResponseDto> {
    if (createCategoryDto.parentId === NIL_UUID) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_CATEGORY_NOT_ALLOW);
    }

    const parent = await this._categoryModel.findOne({
      where: { id: createCategoryDto.parentId, active: true },
    });

    if (!parent) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_CATEGORY_NOT_ALLOW);
    }

    const createResult = await this._categoryModel.create({
      parentId: createCategoryDto.parentId,
      active: true,
      name: createCategoryDto.name,
      slug: createCategoryDto.slug,
      level: parent.level + 1,
      createdBy: user.id,
      updatedBy: user.id,
    });

    return new CategoryResponseDto(createResult);
  }
}
