import { CommentBinding } from '../application/binding/binding-comment/comment.binding';
import { COMMENT_BINDING_TOKEN } from '../application/binding/binding-comment/comment.interface';
import { CreateCommentHandler } from '../application/command/create-comment/create-comment.handler';
import { DeleteCommentHandler } from '../application/command/delete-comment/delete-comment.handler';
import { ReplyCommentHandler } from '../application/command/reply-comment/reply-comment.handler';
import { UpdateCommentHandler } from '../application/command/update-comment/update-comment.handler';
import { FindCommentsArroundIdHandler } from '../application/query/find-comments-arround-id/find-comments-arround-id.handler';
import { FindCommentsPaginationHandler } from '../application/query/find-comments/find-comments-pagination.handler';
import { CommentDomainService } from '../domain/domain-service/comment.domain-service';
import { COMMENT_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface';
import { CommentFactory } from '../domain/factory/comment.factory';
import { COMMENT_FACTORY_TOKEN } from '../domain/factory/interface';
import { COMMENT_QUERY_TOKEN } from '../domain/query-interface';
import { COMMENT_REPOSITORY_TOKEN } from '../domain/repositoty-interface';
import { CommentValidator } from '../domain/validator/comment.validator';
import { COMMENT_VALIDATOR_TOKEN } from '../domain/validator/interface';
import { CommentQuery } from '../driven-adapter/query/comment.query';
import { CommentRepository } from '../driven-adapter/repository/comment.repository';

export const commentProvider = [
  {
    provide: COMMENT_FACTORY_TOKEN,
    useClass: CommentFactory,
  },
  {
    provide: COMMENT_DOMAIN_SERVICE_TOKEN,
    useClass: CommentDomainService,
  },
  {
    provide: COMMENT_REPOSITORY_TOKEN,
    useClass: CommentRepository,
  },
  {
    provide: COMMENT_VALIDATOR_TOKEN,
    useClass: CommentValidator,
  },
  {
    provide: COMMENT_QUERY_TOKEN,
    useClass: CommentQuery,
  },
  {
    provide: COMMENT_BINDING_TOKEN,
    useClass: CommentBinding,
  },
  /** Application */
  CreateCommentHandler,
  ReplyCommentHandler,
  UpdateCommentHandler,
  DeleteCommentHandler,
  FindCommentsPaginationHandler,
  FindCommentsArroundIdHandler,
];
