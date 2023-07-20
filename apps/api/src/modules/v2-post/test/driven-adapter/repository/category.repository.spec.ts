import { Test } from '@nestjs/testing';
import { CategoryRepository } from '../../../driven-adapter/repository/category.repository';
import { getModelToken } from '@nestjs/sequelize';
import { CategoryModel } from '../../../../../database/models/category.model';
import { createMock } from '@golevelup/ts-jest';
import { CATEGORY_FACTORY_TOKEN } from '../../../domain/factory/interface';
import { CategoryFactory } from '../../../domain/factory';
import { Sequelize } from 'sequelize-typescript';
import { ICategoryRepository } from '../../../domain/repositoty-interface';
import { CategoryEntity } from '../../../domain/model/category';
import { categoryRecord } from '../../mock/category.model.mock';
import { categoryEntityMock } from '../../mock/category.entity.mock';
import { Op } from 'sequelize';

describe('CategoryRepository', () => {
  let repo: ICategoryRepository;
  let categoryModel;
  let categoryFactory;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CategoryRepository,
        {
          provide: getModelToken(CategoryModel),
          useValue: createMock<CategoryModel>(),
        },
        {
          provide: CATEGORY_FACTORY_TOKEN,
          useValue: createMock<CategoryFactory>(),
        },
        {
          provide: Sequelize,
          useValue: createMock<Sequelize>(),
        },
      ],
    }).compile();

    repo = module.get<CategoryRepository>(CategoryRepository);
    categoryModel = module.get<CategoryModel>(getModelToken(CategoryModel));
    categoryFactory = module.get<CategoryFactory>(CATEGORY_FACTORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('countCategory', () => {
    it('Should count category success', async () => {
      const spyCount = jest.spyOn(categoryModel, 'count').mockResolvedValue(1);
      const result = await repo.count({
        where: {
          id: categoryEntityMock.get('id'),
        },
      });
      expect(result).toEqual(1);
      expect(categoryModel.count).toBeCalledWith({
        where: {
          id: categoryEntityMock.get('id'),
        },
      });
      expect(spyCount).toBeCalledTimes(1);
    });
  });

  describe('findAllCategory', () => {
    it('should find all category success', async function () {
      const spyFindAll = jest.spyOn(categoryModel, 'findAll').mockResolvedValue([
        {
          toJSON: () => categoryRecord,
        },
      ]);
      jest
        .spyOn(categoryFactory, 'reconstitute')
        .mockReturnValue(new CategoryEntity(categoryRecord));
      const result = await repo.findAll({
        where: {
          id: categoryRecord.id,
          createdBy: categoryRecord.createdBy,
        },
      });

      expect(spyFindAll).toBeCalledTimes(1);
      expect(categoryModel.findAll).toBeCalledWith({
        where: {
          id: categoryRecord.id,
          createdBy: categoryRecord.createdBy,
        },
      });
      expect(result).toEqual([new CategoryEntity(categoryRecord)]);
    });

    it('should find all category success with shouldDisjunctionLevel', async function () {
      const spyFindAll = jest.spyOn(categoryModel, 'findAll').mockResolvedValue([
        {
          toJSON: () => categoryRecord,
        },
      ]);
      jest
        .spyOn(categoryFactory, 'reconstitute')
        .mockReturnValue(new CategoryEntity(categoryRecord));

      const result = await repo.findAll({
        where: {
          ids: [categoryRecord.id],
          createdBy: categoryRecord.createdBy,
          shouldDisjunctionLevel: true,
        },
      });

      expect(spyFindAll).toBeCalledTimes(1);
      expect(categoryModel.findAll).toBeCalledWith({
        where: {
          id: [categoryRecord.id],
          [Op.or]: {
            level: 1,
            createdBy: categoryRecord.createdBy,
          },
        },
      });
      expect(result).toEqual([new CategoryEntity(categoryRecord)]);
    });
  });
});
