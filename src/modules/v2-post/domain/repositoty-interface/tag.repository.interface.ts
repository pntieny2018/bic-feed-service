import { GroupId } from '../../../v2-group/domain/model/group';
import { TagEntity, TagId, TagName } from '../model/tag';

export type FindOneTagProps = {
  name?: TagName;
  id?: TagId;
  groupId?: GroupId;
};

export type FindAllTagsProps = {
  groupIds: GroupId[];
  name?: TagName;
};

export interface ITagRepository {
  findOne(input: FindOneTagProps): Promise<TagEntity>;
  findAll(input: FindAllTagsProps): Promise<TagEntity[]>;
  update(data: TagEntity): Promise<void>;
  create(data: TagEntity): Promise<void>;
  delete(id: TagId): Promise<void>;
}

export const TAG_REPOSITORY_TOKEN = 'TAG_REPOSITORY_TOKEN';
