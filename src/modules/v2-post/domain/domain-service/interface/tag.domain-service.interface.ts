import { GroupId } from '../../../../v2-group/domain/model/group';
import { UserId } from '../../../../v2-user/domain/model/user';
import { TagEntity, TagId, TagName } from '../../model/tag';

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
  updateTag(tag: TagEntity, data: TagUpdateProps): Promise<TagEntity>;
  deleteTag(id: TagId): Promise<void>;
}
export const TAG_DOMAIN_SERVICE_TOKEN = 'TAG_DOMAIN_SERVICE_TOKEN';
