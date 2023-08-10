import { PaginationProps, PaginationResult } from '@app/database/postgres/common';
import { TagModel } from '@app/database/postgres/model/tag.model';

export type GetPaginationTagProps = PaginationProps & {
  groupIds: string[];
  name?: string;
};
export interface ILibTagQuery {
  getPagination(input: GetPaginationTagProps): Promise<PaginationResult<TagModel>>;
}

export const LIB_TAG_QUERY_TOKEN = 'LIB_TAG_QUERY_TOKEN';
