import { PaginationProps, PaginationResult } from '@libs/database/postgres/common';

import { TagEntity } from '../model/tag';

export type FindOneTagProps = {
  name?: string;
  id?: string;
  groupId?: string;
};

export type FindAllTagsProps = {
  ids?: string[];
  groupIds?: string[];
  name?: string;
  keyword?: string;
};

export type GetPaginationTagProps = PaginationProps & {
  groupIds: string[];
  name?: string;
};

export interface ITagRepository {
  getPagination(input: GetPaginationTagProps): Promise<PaginationResult<TagEntity>>;

  findOne(input: FindOneTagProps): Promise<TagEntity>;

  findAll(input: FindAllTagsProps): Promise<TagEntity[]>;

  update(data: TagEntity): Promise<void>;

  create(data: TagEntity): Promise<void>;

  delete(id: string): Promise<void>;
}

export const TAG_REPOSITORY_TOKEN = 'TAG_REPOSITORY_TOKEN';
