import { PaginationProps } from '../../../../common/types/pagination-props.type ';
import { PaginationResult } from '../../../../common/types/pagination-result.type';
import { TagEntity } from '../model/tag';

export type FindOneTagProps = {
  name?: string;
  id?: string;
  groupId?: string;
};

export type FindAllTagsProps = {
  groupIds: string[];
  name?: string;
};

export type GetPaginationTagProps = PaginationProps & {
  groupIds: string[];
  name?: string;
};
export interface ITagRepository {
  findOne(input: FindOneTagProps): Promise<TagEntity>;
  findAll(input: FindAllTagsProps): Promise<TagEntity[]>;
  getPagination(input: GetPaginationTagProps): Promise<PaginationResult<TagEntity>>;
  update(data: TagEntity): Promise<void>;
  create(data: TagEntity): Promise<void>;
  delete(id: string): Promise<void>;
}

export const TAG_REPOSITORY_TOKEN = 'TAG_REPOSITORY_TOKEN';
