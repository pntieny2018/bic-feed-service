import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';

import { FindCategoriesPaginationHandler } from '../../../application/query/category';
import { CategoryDomainService } from '../../../domain/domain-service/category.domain-service';
import { CATEGORY_DOMAIN_SERVICE_TOKEN } from '../../../domain/domain-service/interface';
import { CategoryEntity } from '../../../domain/model/category';

describe('FindCategoriesPaginationHandler', () => {
  let categoryDomainService, handler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindCategoriesPaginationHandler,
        {
          provide: CATEGORY_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<CategoryDomainService>(),
        },
      ],
    }).compile();
    handler = module.get<FindCategoriesPaginationHandler>(FindCategoriesPaginationHandler);
    categoryDomainService = module.get(CATEGORY_DOMAIN_SERVICE_TOKEN);
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
        .spyOn(categoryDomainService, 'getPagination')
        .mockResolvedValue({ rows: categoryEntities, total: 2 });
      const result = await handler.execute({ page: 0, limit: 10 });
      expect(result).toEqual({ rows: categoryRecords, total: 2 });
    });
  });
});
