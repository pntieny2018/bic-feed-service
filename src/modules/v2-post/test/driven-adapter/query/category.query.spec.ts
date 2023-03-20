import { CategoryQuery } from '../../../driven-adapter/query';
import { CategoryModel } from '../../../../../database/models/category.model';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { createMock } from '@golevelup/ts-jest';
import { CategoryFactory } from '../../../domain/factory/category.factory';
import { CATEGORY_FACTORY_TOKEN } from '../../../domain/factory/category.factory.interface';
import { Op } from 'sequelize';
import { v4 } from 'uuid';

describe('CategoryQuery', () => {
  let query: CategoryQuery;
  let categoryModel;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryQuery,
        {
          provide: getModelToken(CategoryModel),
          useValue: createMock<CategoryModel>(),
        },
        {
          provide: CATEGORY_FACTORY_TOKEN,
          useValue: createMock<CategoryFactory>(),
        }
      ],
    }).compile();

    query = module.get<CategoryQuery>(CategoryQuery);
    categoryModel = module.get<CategoryModel>(getModelToken(CategoryModel));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const categoryRecords = [
    {
      "id": "6b9fbc18-04c3-4a4a-bd64-453add6724dd",
      "name": "Outdoors",
      "slug": "outdoors",
      "createdAt": "2022-09-21T08:33:18.881Z"
    },
    {
      "id": "ce8c7613-426d-48e4-8d74-c2a12adc05f9",
      "name": "Fashion & Beauty",
      "slug": "fashion-beauty",
      "createdAt": "2022-09-21T08:33:18.881Z"
    }
  ];

  describe('getPagination', () => {
    it('Should get categories success when request just limit off set', async () => {
      jest.spyOn(categoryModel, 'findAndCountAll').mockResolvedValue({ rows: categoryRecords, count: 2 });
      const result = await query.getPagination({limit: 20, offset: 0});
      expect(categoryModel.findAndCountAll).toBeCalledWith({
        where: {},
        limit: 20,
        offset: 0,
        order: [['zindex', 'DESC']],
      });
    });

    it('Should get categories success when request with name', async () => {
      jest.spyOn(categoryModel, 'findAndCountAll').mockResolvedValue({ rows: categoryRecords, count: 2 });
      const result = await query.getPagination({limit: 20, offset: 0, name: 'outdoors'});
      expect(categoryModel.findAndCountAll).toBeCalledWith({
        where: {
          name: {
            [Op.iLike]: '%outdoors%'
          }
        },
        limit: 20,
        offset: 0,
        order: [['zindex', 'DESC']],
      });
    });

    it('Should get categories success when request with level', async () => {
      jest.spyOn(categoryModel, 'findAndCountAll').mockResolvedValue({ rows: categoryRecords, count: 2 });
      const result = await query.getPagination({limit: 20, offset: 0, level: 1});
      expect(categoryModel.findAndCountAll).toBeCalledWith({
        where: {
          level: 1
        },
        limit: 20,
        offset: 0,
        order: [['zindex', 'DESC']],
      });
    });

    it('Should get categories success when request with createdBy', async () => {
      jest.spyOn(categoryModel, 'findAndCountAll').mockResolvedValue({ rows: categoryRecords, count: 2 });
      const userId = v4();
      const result = await query.getPagination({limit: 20, offset: 0, createdBy: userId});
      expect(categoryModel.findAndCountAll).toBeCalledWith({
        where: {
          createdBy: userId
        },
        limit: 20,
        offset: 0,
        order: [['zindex', 'DESC']],
      });
    });
  });
});
