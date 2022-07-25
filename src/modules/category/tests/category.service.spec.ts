import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from '../category.service';
import { authUserMock } from '../../comment/tests/mocks/user.mock';
import { Sequelize } from 'sequelize-typescript';
import { getModelToken } from '@nestjs/sequelize';
import { CategoryModel } from '../../../database/models/category.model';
import { modelGetResult } from './mocks/get-categories.mock';
import { getCommentMock } from '../../comment/tests/mocks/get-comments.mock';
import { CategoryResponseDto } from '../dto/responses/category-response.dto';
import { createCategoryDto } from './mocks/create-category-dto.mock';
import { BadRequestException } from '@nestjs/common';
import { LogicException } from '../../../common/exceptions';
import { PostCategoryModel } from '../../../database/models/post-category.model';
import { HTTP_STATUS_ID } from '../../../common/constants';

describe('CategoryService', () => {
  let categoryService;
  let categoryModel;
  let postCategoryModel;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: Sequelize,
          useValue: {
            query: jest.fn(),
            transaction: jest.fn(async () => ({
              commit: jest.fn(),
              rollback: jest.fn(),
            })),
            escape: jest.fn(),
          },
        },
        {
          provide: getModelToken(CategoryModel),
          useValue: {
            findOne: jest.fn(),
            findAndCountAll: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            destroy: jest.fn(),
            findByPk: jest.fn(),
          },
        },
        {
          provide: getModelToken(PostCategoryModel),
          useValue: {
            bulkCreate: jest.fn(),
            findAll: jest.fn(),
            destroy: jest.fn(),
          },
        },
      ],
    }).compile();

    categoryService = module.get<CategoryService>(CategoryService);
    categoryModel = module.get<typeof CategoryModel>(getModelToken(CategoryModel));
    postCategoryModel = module.get<typeof PostCategoryModel>(getModelToken(PostCategoryModel));
  })

  describe('CategoryService.getCategory', () => {
    it('should return category', async () => {
      const logSpy = jest.spyOn(categoryService['_logger'], 'debug').mockReturnThis();

      categoryModel.findAll.mockResolvedValue(modelGetResult);

      const categories = await categoryService.getCategory(authUserMock, {offset: 0, limit: 10})

      expect(logSpy).toBeCalled();
      expect(categoryModel.findAll).toBeCalled();
      expect(categories).toEqual({
        "list": modelGetResult.map((e) => new CategoryResponseDto(e)),
        "meta": {
          "limit": 10,
          "offset": 0,
          "total": 5
        }
      });
    });

    it('return index 2,3 if offset to 1 and limit to 2', async () => {
      const logSpy = jest.spyOn(categoryService['_logger'], 'debug').mockReturnThis();

      categoryModel.findAll.mockResolvedValue(modelGetResult);

      const categories = await categoryService.getCategory(authUserMock, {offset: 1, limit: 2})

      expect(logSpy).toBeCalled();
      expect(categoryModel.findAll).toBeCalled();
      expect(categories).toEqual({
        "list": modelGetResult.slice(2,4).map((e) => new CategoryResponseDto(e)),
        "meta": {
          "limit": 2,
          "offset": 1,
          "total": 5
        }
      });
    });

    it('return index 4 if level set to 3', async () => {
      const logSpy = jest.spyOn(categoryService['_logger'], 'debug').mockReturnThis();

      categoryModel.findAll.mockResolvedValue([modelGetResult[4]]);

      const categories = await categoryService.getCategory(authUserMock, {offset: 0, limit: 10, level: 3})

      expect(logSpy).toBeCalled();
      expect(categoryModel.findAll).toBeCalled();
      expect(categories).toEqual({
        "list": [new CategoryResponseDto(modelGetResult[4])],
        "meta": {
          "limit": 10,
          "offset": 0,
          "total": 1
        }
      });
    });
  })

  describe('CategoryService.createCategory', () => {
    it('should return category', async () => {
      const logSpy = jest.spyOn(categoryService['_logger'], 'debug').mockReturnThis();

      categoryModel.findOne.mockResolvedValue(modelGetResult[0]);
      categoryModel.create.mockResolvedValue(createCategoryDto);

      const categories = await categoryService.createCategory(authUserMock, createCategoryDto)

      expect(logSpy).toBeCalled();
      expect(categoryModel.findOne).toBeCalled();
      expect(categoryModel.create).toBeCalled();
      expect(categories).toEqual(createCategoryDto);
    });

    it('fail when create level 0', async () => {
      const logSpy = jest.spyOn(categoryService['_logger'], 'debug').mockReturnThis();
      const createCategoryDto2 = createCategoryDto
      createCategoryDto2.parentId = '00000000-0000-0000-0000-000000000000'
      try {
        await categoryService.createCategory(authUserMock, createCategoryDto2)
      } catch (e) {
        expect(logSpy).toBeCalled();
        expect(e).toBeInstanceOf(LogicException);
        expect((e as LogicException).message).toEqual(HTTP_STATUS_ID.APP_CATEGORY_NOT_ALLOW);
      }
    });
  })

  describe('CategoryService.setCategoriesByPost', () => {
    it('should success', async () => {
      postCategoryModel.findAll.mockResolvedValue([{postId: '1', categoryId: '1'}]);

      const categories = await categoryService.setCategoriesByPost(['2'], '1', null)

      expect(postCategoryModel.findAll).toBeCalled();
      expect(postCategoryModel.destroy).toBeCalled();
      expect(postCategoryModel.bulkCreate).toBeCalled();
    });
  })
})
