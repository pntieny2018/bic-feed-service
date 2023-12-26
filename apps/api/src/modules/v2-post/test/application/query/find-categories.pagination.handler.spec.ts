import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';

import { FindCategoriesPaginationHandler } from '../../../application/query/category';
import { CategoryEntity } from '../../../domain/model/category';
import {
  CATEGORY_REPOSITORY_TOKEN,
  ICategoryRepository,
} from '../../../domain/repositoty-interface';

describe('FindCategoriesPaginationHandler', () => {
  let handler;
  let categoryRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindCategoriesPaginationHandler,
        {
          provide: CATEGORY_REPOSITORY_TOKEN,
          useValue: createMock<ICategoryRepository>(),
        },
      ],
    }).compile();
    handler = module.get<FindCategoriesPaginationHandler>(FindCategoriesPaginationHandler);
    categoryRepository = module.get(CATEGORY_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const categoryRecords = [
    {
      id: v4(),
      name: 'category1',
      slug: 'category1',
      parentId: '00000000-0000-0000-0000-000000000000',
      level: 1,
      active: true,
      createdBy: v4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: v4(),
      name: 'category2',
      slug: 'category2',
      parentId: '00000000-0000-0000-0000-000000000000',
      level: 1,
      active: true,
      createdBy: v4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const categoryEntities = categoryRecords.map((categoryRecord) => {
    return new CategoryEntity({
      ...categoryRecord,
      updatedBy: categoryRecord.createdBy,
      zindex: 0,
      isActive: categoryRecord.active,
    });
  });
  describe('execute', () => {
    it('should find categories success', async () => {
      jest
        .spyOn(categoryRepository, 'getPagination')
        .mockResolvedValue({ rows: categoryEntities, total: 2 });
      const result = await handler.execute({ page: 0, limit: 10 });
      expect(result).toEqual({ rows: categoryRecords, total: 2 });
    });
  });
});
