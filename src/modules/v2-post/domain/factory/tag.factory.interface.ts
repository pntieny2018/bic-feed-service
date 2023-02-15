import { GroupId } from '../../../v2-group/domain/model/group';
import { UserId } from '../../../v2-user/domain/model/user';
import { TagEntity, TagName } from '../model/tag';

export type CreateTagOptions = Readonly<{
  name: TagName;
  groupId: GroupId;
  userId: UserId;
}>;
export interface ITagFactory {
  create(options: CreateTagOptions): TagEntity;
}
export const TAG_FACTORY_TOKEN = 'TAG_FACTORY_TOKEN';
