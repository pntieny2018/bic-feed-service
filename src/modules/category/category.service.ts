import { Injectable, Logger } from '@nestjs/common';
import { CategoryResponseDto } from './dto/responses/category-response.dto';
import { CreateCategoryDto } from './dto/requests/create-category.dto';
import { InjectModel } from '@nestjs/sequelize';
import { CategoryModel } from '../../database/models/category.model';
import { NIL as NIL_UUID } from 'uuid';
import { ExceptionHelper, StringHelper } from '../../common/helpers';
import { HTTP_STATUS_ID } from '../../common/constants';
import { UserDto } from '../auth';
import { PageDto } from '../../common/dto';
import { GetCategoryDto } from './dto/requests/get-category.dto';
import { Op } from 'sequelize';

@Injectable()
export class CategoryService {
  public constructor(@InjectModel(CategoryModel) private _categoryModel: typeof CategoryModel) {}
  private _logger = new Logger(CategoryService.name);

  public async getCategory(
    user: UserDto,
    getCategoryDto: GetCategoryDto
  ): Promise<PageDto<CategoryResponseDto>> {
    this._logger.debug('getCategory');
    const conditions = {};
    if (getCategoryDto.isCreatedByMe) {
      conditions['createBy'] = user.id;
    }
    if (getCategoryDto.name) {
      conditions['name'] = { [Op.like]: '%' + getCategoryDto.name + '%' };
    }
    if (getCategoryDto.level) {
      conditions['level'] = getCategoryDto.level;
    }
    const getResult = await this._categoryModel.findAll({ where: conditions });

    const pagingResult = getResult
      .slice(
        getCategoryDto.offset * getCategoryDto.limit,
        getCategoryDto.limit * (getCategoryDto.offset + 1)
      )
      .map((e) => new CategoryResponseDto(e));

    return new PageDto<CategoryResponseDto>(pagingResult, {
      total: getResult.length,
      limit: getCategoryDto.limit,
      offset: getCategoryDto.offset,
    });
  }

  public async createCategory(
    user: UserDto,
    createCategoryDto: CreateCategoryDto
  ): Promise<CategoryResponseDto> {
    this._logger.debug('createCategory');

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
      slug: StringHelper.convertToSlug(createCategoryDto.name),
      level: parent.level + 1,
      createdBy: user.id,
      updatedBy: user.id,
    });

    return new CategoryResponseDto(createResult);
  }
}
