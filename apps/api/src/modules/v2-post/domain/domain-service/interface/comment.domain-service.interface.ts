import { BasedCommentProps } from '../../factory/interface';
import { CommentEntity } from '../../model/comment';

export type CreateCommentProps = BasedCommentProps;

export type UpdateCommentProps = BasedCommentProps & { id: string };

export interface ICommentDomainService {
  getVisibleComment(id: string): Promise<CommentEntity>;

  create(data: CreateCommentProps): Promise<CommentEntity>;

  update(input: UpdateCommentProps): Promise<void>;
}
export const COMMENT_DOMAIN_SERVICE_TOKEN = 'COMMENT_DOMAIN_SERVICE_TOKEN';
