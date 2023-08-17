import { CreateReactionHandler } from '../application/command/create-reaction/create-reaction.handler';
import { DeleteReactionHandler } from '../application/command/delete-reaction/delete-reaction.handler';
import { ReactionNotifyEventHandler } from '../application/event-handler/reaction/reaction-notify.event-handler';
import { FindReactionsHandler } from '../application/query/find-reactions/find-reactions.handler';
import { REACTION_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface/reaction.domain-service.interface';
import { ReactionDomainService } from '../domain/domain-service/reaction.domain-service';
import { REACTION_FACTORY_TOKEN } from '../domain/factory/interface/reaction.factory.interface';
import { ReactionFactory } from '../domain/factory/reaction.factory';
import { REACTION_QUERY_TOKEN } from '../domain/query-interface/reaction.query.interface';
import {
  COMMENT_REACTION_REPOSITORY_TOKEN,
  POST_REACTION_REPOSITORY_TOKEN,
} from '../domain/repositoty-interface';
import { ReactionQuery } from '../driven-adapter/query/reaction.query';
import { CommentReactionRepository } from '../driven-adapter/repository/comment-reaction.repository';
import { PostReactionRepository } from '../driven-adapter/repository/post-reaction.repository';

export const reactionProvider = [
  {
    provide: REACTION_QUERY_TOKEN,
    useClass: ReactionQuery,
  },
  {
    provide: REACTION_FACTORY_TOKEN,
    useClass: ReactionFactory,
  },
  {
    provide: POST_REACTION_REPOSITORY_TOKEN,
    useClass: PostReactionRepository,
  },
  {
    provide: COMMENT_REACTION_REPOSITORY_TOKEN,
    useClass: CommentReactionRepository,
  },
  {
    provide: REACTION_DOMAIN_SERVICE_TOKEN,
    useClass: ReactionDomainService,
  },
  FindReactionsHandler,
  CreateReactionHandler,
  DeleteReactionHandler,

  /* Event handler */
  ReactionNotifyEventHandler,
];
