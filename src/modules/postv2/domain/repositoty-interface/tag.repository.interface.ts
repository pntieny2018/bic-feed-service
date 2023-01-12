import { PaginationProps } from '../../../../common/types/pagination-props.type ';
import { PaginationResult } from '../../../../common/types/pagination-result.type';
import { Tag } from '../model';

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
  findOne(input: FindOneTagProps): Promise<Tag>;
  findAll(input: FindAllTagsProps): Promise<Tag[]>;
  getPagination(input: GetPaginationTagProps): Promise<PaginationResult<Tag>>;
  update(data: Tag): Promise<void>;
  create(data: Tag): Promise<void>;
  delete(id: string): Promise<void>;
}

export const TAG_REPOSITORY = 'TAG_REPOSITORY';
