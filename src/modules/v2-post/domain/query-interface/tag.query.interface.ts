import { PaginationProps } from '../../../../common/types/pagination-props.type ';
import { PaginationResult } from '../../../../common/types/pagination-result.type';
import { GroupId } from '../../../v2-group/domain/model/group';
import { TagEntity } from '../model/tag';

export type GetPaginationTagProps = PaginationProps & {
  groupIds: GroupId[];
  name?: string;
};
export interface ITagQuery {
  getPagination(input: GetPaginationTagProps): Promise<PaginationResult<TagEntity>>;
}

export const TAG_QUERY_TOKEN = 'TAG_QUERY_TOKEN';
