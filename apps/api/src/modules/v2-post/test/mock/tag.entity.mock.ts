import { ITag } from '../../../../database/models/tag.model';
import { TagEntity } from '../../domain/model/tag';

export const mockTagRecord: ITag = {
  id: '7b63852c-5249-499a-a32b-6bdaa2761fc1',
  groupId: '7b63852c-5249-499a-a32b-6bdaa2761fc1',
  name: 'string',
  slug: 'string',
  createdBy: '7b63852c-5249-499a-a32b-6bdaa2761fc1',
  updatedBy: '7b63852c-5249-499a-a32b-6bdaa2761fc1',
  createdAt: new Date(),
  updatedAt: new Date(),
  totalUsed: 1,
};

export const mockTagEntity = new TagEntity(mockTagRecord);
