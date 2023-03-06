import { REACTION_QUERY_TOKEN } from '../domain/query-interface';
import { FindReactionsHandler } from '../application/query/find-reactions/find-reactions.handler';
import { ReactionQuery } from '../driven-adapter/query';
import { REACTION_FACTORY_TOKEN, ReactionFactory } from '../domain/factory';
import { ReactionDomainService } from '../domain/domain-service';
import { CreateReactionHandler } from '../application/command/create-reaction/create-reaction.handler';
import { DeleteReactionHandler } from '../application/command/delete-reaction/delete-reaction.handler';
import { CommentReactionRepository } from '../driven-adapter/repository/comment-reaction.repository';
import { PostReactionRepository } from '../driven-adapter/repository/post-reaction.repository';
import {
  COMMENT_REACTION_REPOSITORY_TOKEN,
  POST_REACTION_REPOSITORY_TOKEN,
} from '../domain/repositoty-interface';
import { REACTION_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface';

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
];
