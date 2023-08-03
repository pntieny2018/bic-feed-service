import { ILinkPreview } from '../../../../database/models/link-preview.model';
import { LinkPreviewEntity } from '../../domain/model/link-preview';

export const mockLinkPreviewRecord: ILinkPreview = {
  id: '7b63852c-5249-499a-a32b-6bdaa2761fc1',
  url: 'string',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockLinkPreviewEntity = new LinkPreviewEntity(mockLinkPreviewRecord);
