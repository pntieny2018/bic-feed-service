import { CreateCommentProps } from '../../factory/interface/comment.factory.interface';
import { CommentEntity } from '../../model/comment';

export interface ICommentDomainService {
  create(data: CreateCommentProps): Promise<CommentEntity>;
}
export const COMMENT_DOMAIN_SERVICE_TOKEN = 'COMMENT_DOMAIN_SERVICE_TOKEN';
