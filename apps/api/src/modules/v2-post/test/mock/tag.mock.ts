import { TagAttributes } from '@libs/database/postgres/model/tag.model';
import { v4 } from 'uuid';

import { TagEntity } from '../../domain/model/tag';

export function createMockTagRecord(data: Partial<TagAttributes> = {}): TagAttributes {
  const tagId = v4();
  const groupId = v4();
  const ownerId = v4();
  const now = new Date();

  return {
    id: tagId,
    groupId,
    name: 'test tag',
    slug: 'test-tag',
    totalUsed: 1,
    createdBy: ownerId,
    updatedBy: ownerId,
    createdAt: now,
    updatedAt: now,
    ...data,
  };
}

export function createMockTagEntity(data: Partial<TagAttributes> = {}): TagEntity {
  const tag = createMockTagRecord(data);
  return new TagEntity(tag);
}
