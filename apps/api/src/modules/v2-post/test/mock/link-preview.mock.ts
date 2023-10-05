import { LinkPreviewAttributes } from '@libs/database/postgres/model/link-preview.model';
import { v4 } from 'uuid';

import { LinkPreviewEntity } from '../../domain/model/link-preview';

export function createMockLinkPreviewRecord(
  data: Partial<LinkPreviewAttributes> = {}
): LinkPreviewAttributes {
  return {
    id: v4(),
    url: 'https://www.google.com/',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
  };
}

export function createMockLinkPreviewEntity(
  data: Partial<LinkPreviewAttributes> = {}
): LinkPreviewEntity {
  return new LinkPreviewEntity(createMockLinkPreviewRecord(data));
}
