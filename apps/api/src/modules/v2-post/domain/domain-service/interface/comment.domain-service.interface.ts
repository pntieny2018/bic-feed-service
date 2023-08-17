import { CursorPaginationResult } from '../../../../../common/types/cursor-pagination-result.type';
import { BasedCommentProps } from '../../factory/interface';
import { CommentEntity } from '../../model/comment';

export type CreateCommentProps = BasedCommentProps;

export type UpdateCommentProps = BasedCommentProps & { id: string };

export type GetCommentsAroundIdProps = {
  userId?: string;
  limit: number;
  targetChildLimit: number;
};

export interface ICommentDomainService {
  getVisibleComment(id: string, excludeReportedByUserId?: string): Promise<CommentEntity>;

  getCommentsAroundId(
    id: string,
    props: GetCommentsAroundIdProps
  ): Promise<CursorPaginationResult<CommentEntity>>;

  create(data: CreateCommentProps): Promise<CommentEntity>;

  update(input: UpdateCommentProps): Promise<void>;

  delete(id: string): Promise<void>;
}
export const COMMENT_DOMAIN_SERVICE_TOKEN = 'COMMENT_DOMAIN_SERVICE_TOKEN';
