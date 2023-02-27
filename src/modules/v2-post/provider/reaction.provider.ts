import { REACTION_REPOSITORY_TOKEN } from '../domain/repositoty-interface/reaction.repository.interface';
import { REACTION_QUERY_TOKEN } from '../domain/query-interface';
import { FindReactionsHandler } from '../application/query/find-reactions/find-reactions.handler';
import { ReactionQuery } from '../driven-adapter/query/reaction.query';
import { ReactionFactory } from '../domain/factory/reaction.factory';
import { REACTION_FACTORY_TOKEN } from '../domain/factory/reaction.factory.interface';

export const reactionProvider = [
  // {
  //   provide: REACTION_REPOSITORY_TOKEN,
  //   useClass: ReactionRepository,
  // },
  {
    provide: REACTION_QUERY_TOKEN,
    useClass: ReactionQuery,
  },
  // {
  //   provide: REACTION_DOMAIN_SERVICE_TOKEN,
  //   useClass: ReactionDomainService,
  // },
  {
    provide: REACTION_FACTORY_TOKEN,
    useClass: ReactionFactory,
  },
  /** Application */
  // CreateReactionHandler,
  // UpdateReactionHandler,
  // DeleteReactionHandler,
  FindReactionsHandler,
];
