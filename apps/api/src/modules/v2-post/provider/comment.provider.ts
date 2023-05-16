import { CreateCommentHandler } from '../application/command/create-comment/create-comment.handler';
import { ReplyCommentHandler } from '../application/command/reply-comment/reply-comment.handler';
import { UpdateCommentHandler } from '../application/command/update-comment/update-comment.handler';
import { CommentDomainService } from '../domain/domain-service/comment.domain-service';
import { COMMENT_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface';
import { CommentFactory } from '../domain/factory/comment.factory';
import { COMMENT_FACTORY_TOKEN } from '../domain/factory/interface';
import { COMMENT_REPOSITORY_TOKEN } from '../domain/repositoty-interface';
import { CommentValidator } from '../domain/validator/comment.validator';
import { COMMENT_VALIDATOR_TOKEN } from '../domain/validator/interface';
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
  /** Application */
  CreateCommentHandler,
  ReplyCommentHandler,
  UpdateCommentHandler,
];
