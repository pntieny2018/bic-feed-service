import {
  CacheCountCommentCreatedEventHandler,
  CacheCountCommentDeletedEventHandler,
} from '@api/modules/v2-post/application/event-handler/cache';
import { LibCommentRepository, LibFollowRepository } from '@libs/database/postgres/repository';

import { CommentBinding, COMMENT_BINDING_TOKEN } from '../application/binding';
import {
  CreateCommentHandler,
  DeleteCommentHandler,
  ReplyCommentHandler,
  UpdateCommentHandler,
} from '../application/command/comment';
import { CommentCreatedEventHandler } from '../application/event-handler/comment';
import {
  NotiCommentCreatedEventHandler,
  NotiCommentDeletedEventHandler,
  NotiCommentUpdatedEventHandler,
} from '../application/event-handler/send-notification';
import {
  FindCommentsAroundIdHandler,
  FindCommentsPaginationHandler,
  GetMyReportedCommentHandler,
  GetMyReportedCommentsHandler,
} from '../application/query/comment';
import { CommentDomainService } from '../domain/domain-service/comment.domain-service';
import { COMMENT_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface';
import { COMMENT_REPOSITORY_TOKEN } from '../domain/repositoty-interface';
import { CommentValidator } from '../domain/validator/comment.validator';
import { COMMENT_VALIDATOR_TOKEN } from '../domain/validator/interface';
import { CommentMapper } from '../driven-adapter/mapper/comment.mapper';
import { CommentRepository } from '../driven-adapter/repository';

export const commentProvider = [
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
    provide: COMMENT_BINDING_TOKEN,
    useClass: CommentBinding,
  },
  LibCommentRepository,
  LibFollowRepository,

  /** Application */
  CreateCommentHandler,
  ReplyCommentHandler,
  UpdateCommentHandler,
  DeleteCommentHandler,
  FindCommentsPaginationHandler,
  FindCommentsAroundIdHandler,
  GetMyReportedCommentsHandler,
  GetMyReportedCommentHandler,

  CommentMapper,

  CommentCreatedEventHandler,
  NotiCommentCreatedEventHandler,
  NotiCommentDeletedEventHandler,
  NotiCommentUpdatedEventHandler,

  CacheCountCommentCreatedEventHandler,
  CacheCountCommentDeletedEventHandler,
];
