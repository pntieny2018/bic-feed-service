import { LibCommentReactionRepository } from '@libs/database/postgres/repository/comment-reaction.repository';
import { LIB_COMMENT_REACTION_REPOSITORY_TOKEN } from '@libs/database/postgres/repository/interface';

import { ReactionBinding, REACTION_BINDING_TOKEN } from '../application/binding';
import { CreateReactionHandler, DeleteReactionHandler } from '../application/command/reaction';
import { ReactionNotifyEventHandler } from '../application/event-handler/reaction';
import { FindReactionsHandler } from '../application/query/reaction';
import { REACTION_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface';
import { ReactionDomainService } from '../domain/domain-service/reaction.domain-service';
import { REACTION_FACTORY_TOKEN } from '../domain/factory/interface/reaction.factory.interface';
import { ReactionFactory } from '../domain/factory/reaction.factory';
import {
  COMMENT_REACTION_REPOSITORY_TOKEN,
  POST_REACTION_REPOSITORY_TOKEN,
  REACTION_REPOSITORY_TOKEN,
} from '../domain/repositoty-interface';
import { CommentReactionMapper } from '../driven-adapter/mapper/comment-reaction.mapper';
import {
  CommentReactionRepository,
  PostReactionRepository,
  ReactionRepository,
} from '../driven-adapter/repository';

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
    provide: REACTION_REPOSITORY_TOKEN,
    useClass: ReactionRepository,
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
    provide: LIB_COMMENT_REACTION_REPOSITORY_TOKEN,
    useClass: LibCommentReactionRepository,
  },

  /* Mapper */
  CommentReactionMapper,
];
