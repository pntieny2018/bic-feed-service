import { CategoryFactory } from '../../../domain/factory';
import { Test } from '@nestjs/testing';
import { categoryRecord } from '../../mock/category.model.mock';
import { categoryEntityMock } from '../../mock/category.entity.mock';

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
  });
});
