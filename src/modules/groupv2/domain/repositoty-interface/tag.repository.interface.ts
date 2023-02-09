import { PaginationProps } from '../../../../common/types/pagination-props.type ';
import { PaginationResult } from '../../../../common/types/pagination-result.type';
import { GroupId } from '../model/group';
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

export type GetPaginationTagProps = PaginationProps & {
  groupIds: GroupId[];
  name?: TagName;
};
export interface ITagRepository {
  findOne(input: FindOneTagProps): Promise<TagEntity>;
  findAll(input: FindAllTagsProps): Promise<TagEntity[]>;
  getPagination(input: GetPaginationTagProps): Promise<PaginationResult<TagEntity>>;
  update(data: TagEntity): Promise<void>;
  create(data: TagEntity): Promise<void>;
  delete(id: TagId): Promise<void>;
}

export const TAG_REPOSITORY_TOKEN = 'TAG_REPOSITORY_TOKEN';
