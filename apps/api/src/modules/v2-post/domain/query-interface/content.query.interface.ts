import { CursorPaginationResult } from '../../../../common/types/cursor-pagination-result.type';
import { PostEntity, SeriesEntity } from '../model/content';
import { ArticleEntity } from '../model/content/article.entity';
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
