import { CursorPaginationProps } from '../../../../common/types/cursor-pagination-props.type';
import { PostType } from '../../data-type';

export type SearchContentProps = CursorPaginationProps & {
  groupId: string;
  isImportant?: boolean;
  isSavedBy?: string;
  createdBy?: string;
  type?: PostType;
};
export interface IContentQuery {}

export const CONTENT_QUERY_TOKEN = 'CONTENT_QUERY_TOKEN';
