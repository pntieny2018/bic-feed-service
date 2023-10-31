import { ReactionBinding, REACTION_BINDING_TOKEN } from '../application/binding';
import { CreateReactionHandler, DeleteReactionHandler } from '../application/command/reaction';
import { FindReactionsHandler } from '../application/query/reaction';
import { REACTION_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface';
import { ReactionDomainService } from '../domain/domain-service/reaction.domain-service';
import { REACTION_FACTORY_TOKEN } from '../domain/factory/interface/reaction.factory.interface';
import { ReactionFactory } from '../domain/factory/reaction.factory';
import {
  COMMENT_REACTION_REPOSITORY_TOKEN,
  POST_REACTION_REPOSITORY_TOKEN,
} from '../domain/repositoty-interface';
import { REACTION_VALIDATOR_TOKEN } from '../domain/validator/interface';
import { ReactionValidator } from '../domain/validator/reaction.validator';
import { CommentReactionMapper } from '../driven-adapter/mapper/comment-reaction.mapper';
import { PostReactionMapper } from '../driven-adapter/mapper/post-reaction.mapper';
import { CommentReactionRepository, PostReactionRepository } from '../driven-adapter/repository';

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
    provide: POST_REACTION_REPOSITORY_TOKEN,
    useClass: PostReactionRepository,
  },
  {
    provide: COMMENT_REACTION_REPOSITORY_TOKEN,
    useClass: CommentReactionRepository,
  },

  /* Mapper */
  CommentReactionMapper,
  PostReactionMapper,

  {
    provide: REACTION_VALIDATOR_TOKEN,
    useClass: ReactionValidator,
  },
];
