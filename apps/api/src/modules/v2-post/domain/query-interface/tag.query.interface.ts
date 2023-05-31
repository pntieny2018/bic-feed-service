import { PaginationProps } from '../../../../common/types/pagination-props.type';
import { PaginationResult } from '../../../../common/types/pagination-result.type';
import { TagEntity } from '../model/tag';

export type GetPaginationTagProps = PaginationProps & {
  groupIds: string[];
  name?: string;
};
export interface ITagQuery {
  getPagination(input: GetPaginationTagProps): Promise<PaginationResult<TagEntity>>;
}

export const TAG_QUERY_TOKEN = 'TAG_QUERY_TOKEN';
