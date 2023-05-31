import { OrderEnum } from '../../../../common/dto';
import { CommentEntity } from '../model/comment';
import { CursorPaginationProps } from '../../../../common/types/cursor-pagination-props.type';
import { CursorPaginationResult } from '../../../../common/types/cursor-pagination-result.type';
import { UserDto } from '../../../v2-user/application';

export type GetPaginationCommentProps = CursorPaginationProps & {
  authUser?: UserDto;
  order: OrderEnum;
  postId: string;
  parentId?: string;
};

export interface ICommentQuery {
  getPagination(input: GetPaginationCommentProps): Promise<CursorPaginationResult<CommentEntity>>;
}

export const COMMENT_QUERY_TOKEN = 'COMMENT_QUERY_TOKEN';
