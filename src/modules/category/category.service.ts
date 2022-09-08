import { Injectable, Logger } from '@nestjs/common';
import { CategoryResponseDto } from './dto/responses/category-response.dto';
import { CreateCategoryDto } from './dto/requests/create-category.dto';
import { InjectModel } from '@nestjs/sequelize';
import { CategoryModel } from '../../database/models/category.model';
import { NIL as NIL_UUID } from 'uuid';
import { ArrayHelper, ExceptionHelper, StringHelper } from '../../common/helpers';
import { HTTP_STATUS_ID } from '../../common/constants';
import { UserDto } from '../auth';
import { PageDto } from '../../common/dto';
import { GetCategoryDto } from './dto/requests/get-category.dto';
import { Op, Transaction } from 'sequelize';
import { LogicException } from '../../common/exceptions';
import { PostCategoryModel } from '../../database/models/post-category.model';
import { ClassTransformer } from 'class-transformer';

@Injectable()
export class CategoryService {
  private _classTransformer = new ClassTransformer();
  public constructor(
    @InjectModel(CategoryModel)
    private _categoryModel: typeof CategoryModel,
    @InjectModel(PostCategoryModel)
    private _postCategoryModel: typeof PostCategoryModel
  ) {}
  private _logger = new Logger(CategoryService.name);

  public async get(
    user: UserDto,
    getCategoryDto: GetCategoryDto
  ): Promise<PageDto<CategoryResponseDto>> {
    this._logger.debug('getCategory');
    const conditions = {};
    const { offset, limit, isCreatedByMe, name, level } = getCategoryDto;
    if (isCreatedByMe) {
      conditions['createBy'] = user.id;
    }
    if (name) {
      conditions['name'] = { [Op.iLike]: '%' + name + '%' };
    }
    if (level) {
      conditions['level'] = level;
    }

    const { rows, count } = await this._categoryModel.findAndCountAll({
      where: conditions,
      offset,
      limit,
      order: [['name', 'ASC']],
    });

    const jsonSeries = rows.map((r) => r.toJSON());
    const result = this._classTransformer.plainToInstance(CategoryResponseDto, jsonSeries, {
      excludeExtraneousValues: true,
    });
    return new PageDto<CategoryResponseDto>(result, {
      total: count,
      limit: getCategoryDto.limit,
      offset: getCategoryDto.offset,
    });
  }

  public async create(
    user: UserDto,
    createCategoryDto: CreateCategoryDto
  ): Promise<CategoryResponseDto> {
    this._logger.debug('createCategory');

    if (createCategoryDto.parentId === NIL_UUID) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_CATEGORY_NOT_ALLOW);
    }

    const parent = await this._categoryModel.findOne({
      where: { id: createCategoryDto.parentId, isActive: true },
    });

    if (!parent) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_CATEGORY_NOT_ALLOW);
    }

    const createResult = await this._categoryModel.create({
      parentId: createCategoryDto.parentId,
      isActive: true,
      name: createCategoryDto.name,
      slug: StringHelper.convertToSlug(createCategoryDto.name),
      level: parent.level + 1,
      createdBy: user.id,
      updatedBy: user.id,
    });

    return this._classTransformer.plainToInstance(CategoryResponseDto, createResult, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Add post to categories
   * @param categoryIds Array of Category ID
   * @param postId string
   * @param transaction Transaction
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async addToPost(
    categoryIds: string[],
    postId: string,
    transaction: Transaction
  ): Promise<void> {
    if (categoryIds.length === 0) return;
    const dataCreate = categoryIds.map((categoryId) => ({
      postId: postId,
      categoryId,
    }));
    await this._postCategoryModel.bulkCreate(dataCreate, { transaction });
  }

  /**
   * Delete/Insert category by post
   * @param categoryIds Array of Category ID
   * @param postId PostID
   * @param transaction Transaction
   * @returns Promise resolve boolean
   * @throws HttpException
   */
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

  public async checkValidCategory(categoryIds: string[], userId: string): Promise<void> {
    const categoryCount = await this._categoryModel.count({
      where: {
        id: categoryIds,
        [Op.or]: {
          level: 1,
          createdBy: userId,
        },
      },
    });
    if (categoryCount < categoryIds.length) {
      throw new LogicException(HTTP_STATUS_ID.APP_CATEGORY_INVALID_PARAMETER);
    }
  }
}
