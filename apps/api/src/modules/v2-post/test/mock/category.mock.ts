import { CategoryAttributes } from '@libs/database/postgres/model/category.model';
import { v4 } from 'uuid';

import { CategoryEntity } from '../../domain/model/category';

export function createMockCategoryRecord(
  data: Partial<CategoryAttributes> = {}
): CategoryAttributes {
  const ownerId = v4();
  const now = new Date();

  return {
    id: v4(),
    parentId: v4(),
    isActive: true,
    name: 'Category 1',
    level: 1,
    zindex: 1,
    slug: 'category-1',
    createdBy: ownerId,
    updatedBy: ownerId,
    createdAt: now,
    updatedAt: now,
    ...data,
  };
}

export function createMockCategoryEntity(data: Partial<CategoryAttributes> = {}): CategoryEntity {
  const category = createMockCategoryRecord(data);
  return new CategoryEntity(category);
}
