import { GroupId } from '../../model/group';
import { TagEntity, TagId, TagName } from '../../model/tag';
import { UserId } from '../../model/user';

export type TagCreateProps = {
  name: TagName;
  groupId: GroupId;
  userId: UserId;
};

export type TagUpdateProps = {
  name: TagName;
  id: TagId;
  userId: UserId;
};

export interface ITagDomainService {
  createTag(data: TagCreateProps): Promise<TagEntity>;
  updateTag(tag: TagEntity, data: TagUpdateProps): Promise<void>;
  deleteTag(id: TagId): Promise<void>;
}
export const TAG_DOMAIN_SERVICE_TOKEN = 'TAG_DOMAIN_SERVICE_TOKEN';
