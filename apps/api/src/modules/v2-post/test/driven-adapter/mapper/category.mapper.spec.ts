import { TestBed } from '@automock/jest';
import { CategoryAttributes, CategoryModel } from '@libs/database/postgres/model';

import { CategoryEntity } from '../../../domain/model/category';
import { CategoryMapper } from '../../../driven-adapter/mapper/category.mapper';
import { createMockCategoryEntity, createMockCategoryRecord } from '../../mock/category.mock';

describe('CategoryMapper', () => {
  let _categoryMapper: CategoryMapper;

  let mockCategoryRecord: CategoryAttributes;
  let mockCategoryEntity: CategoryEntity;

  beforeEach(async () => {
    const { unit } = TestBed.create(CategoryMapper).compile();

    _categoryMapper = unit;

    mockCategoryRecord = createMockCategoryRecord();
    mockCategoryEntity = createMockCategoryEntity(mockCategoryRecord);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('toDomain', () => {
    it('Should map category model to entity success', async () => {
      const mockCategoryModel = {
        ...mockCategoryRecord,
        toJSON: () => mockCategoryRecord,
      } as CategoryModel;

      const categoryEntity = _categoryMapper.toDomain(mockCategoryModel);

      expect(categoryEntity).toEqual(mockCategoryEntity);
    });

    it('Should return null if category model is null', async () => {
      const categoryEntity = _categoryMapper.toDomain(null);

      expect(categoryEntity).toBeNull();
    });
  });

  describe('toPersistence', () => {
    it('Should map category entity to record success', async () => {
      const categoryRecord = _categoryMapper.toPersistence(mockCategoryEntity);

      expect(categoryRecord).toEqual(mockCategoryRecord);
    });
  });
});
