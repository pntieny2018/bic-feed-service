import { ReactionBinding, REACTION_BINDING_TOKEN } from '../application/binding';
import { CreateReactionHandler, DeleteReactionHandler } from '../application/command/reaction';
import { ReactionNotifyEventHandler } from '../application/event-handler/reaction';
import { FindReactionsHandler } from '../application/query/reaction';
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
  /* Application Binding */
  {
    provide: REACTION_BINDING_TOKEN,
    useClass: ReactionBinding,
  },

  /* Application Command */
  CreateReactionHandler,
  DeleteReactionHandler,

  /* Application Query */
  FindReactionsHandler,

  /* Application Event handler */
  ReactionNotifyEventHandler,

  /* Domain Service */
  {
    provide: REACTION_DOMAIN_SERVICE_TOKEN,
    useClass: ReactionDomainService,
  },
  {
    provide: REACTION_FACTORY_TOKEN,
    useClass: ReactionFactory,
  },

  /* Repository */
  {
    provide: REACTION_QUERY_TOKEN,
    useClass: ReactionQuery,
  },
  {
    provide: POST_REACTION_REPOSITORY_TOKEN,
    useClass: PostReactionRepository,
  },
  {
    provide: COMMENT_REACTION_REPOSITORY_TOKEN,
    useClass: CommentReactionRepository,
  },
];
