import { Test } from '@nestjs/testing';

import { CategoryFactory } from '../../../domain/factory';
import { createMockCategoryEntity, createMockCategoryRecord } from '../../mock/category.mock';

const categoryEntityMock = createMockCategoryEntity();
const categoryRecord = createMockCategoryRecord();

describe('CategoryFactory', () => {
  let categoryFactory: CategoryFactory;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [CategoryFactory],
    }).compile();

    categoryFactory = module.get<CategoryFactory>(CategoryFactory);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('reconstitute', () => {
    it('should reconstitute a category entity', async () => {
      const res = await categoryFactory.reconstitute(categoryRecord);
      expect(res).toEqual(categoryEntityMock);
    });

    it('should throw an error if category id is not uuid', async () => {
      try {
        await categoryFactory.reconstitute({
          ...categoryRecord,
          id: 'not-uuid',
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
