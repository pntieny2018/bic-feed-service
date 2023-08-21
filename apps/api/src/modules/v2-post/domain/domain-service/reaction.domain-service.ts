import { Inject, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';

import { DatabaseException } from '../../../../common/exceptions';
import { PaginationResult } from '../../../../common/types/pagination-result.type';
import { REACTION_TARGET } from '../../data-type';
import { ReactionNotifyEvent } from '../event';
import { ReactionNotFoundException, ReactionNotHaveAuthorityException } from '../exception';
import {
  IReactionFactory,
  REACTION_FACTORY_TOKEN,
} from '../factory/interface/reaction.factory.interface';
import { ReactionEntity } from '../model/reaction';
import { IReactionQuery, REACTION_QUERY_TOKEN } from '../query-interface/reaction.query.interface';
import {
  COMMENT_REACTION_REPOSITORY_TOKEN,
  ICommentReactionRepository,
  IPostReactionRepository,
  POST_REACTION_REPOSITORY_TOKEN,
} from '../repositoty-interface';

import {
  DeleteReactionProps,
  GetReactionsProps,
  IReactionDomainService,
  ReactionCreateProps,
} from './interface/reaction.domain-service.interface';
export class ReactionDomainService implements IReactionDomainService {
  private readonly _logger = new Logger(ReactionDomainService.name);

  public constructor(
    @Inject(REACTION_QUERY_TOKEN) private readonly _reactionQuery: IReactionQuery,
    @Inject(POST_REACTION_REPOSITORY_TOKEN)
    private readonly _postReactionRepository: IPostReactionRepository,
    @Inject(COMMENT_REACTION_REPOSITORY_TOKEN)
    private readonly _commentReactionRepository: ICommentReactionRepository,
    @Inject(REACTION_FACTORY_TOKEN)
    private readonly _reactionFactory: IReactionFactory,
    private readonly eventBus: EventBus
  ) {}

  public async getReactions(props: GetReactionsProps): Promise<PaginationResult<ReactionEntity>> {
    return this._reactionQuery.getPagination(props);
  }

  public async createReaction(input: ReactionCreateProps): Promise<ReactionEntity> {
    const { reactionName, createdBy, target, targetId } = input;
    const reactionEntity = this._reactionFactory.create({
      target,
      reactionName,
      createdBy,
      targetId: targetId,
    });
    if (target === REACTION_TARGET.POST || target === REACTION_TARGET.ARTICLE) {
      await this._postReactionRepository.create(reactionEntity);
    } else if (target === REACTION_TARGET.COMMENT) {
      await this._commentReactionRepository.create(reactionEntity);
    } else {
      throw new DatabaseException();
    }
    this.eventBus.publish(new ReactionNotifyEvent(reactionEntity, 'create'));
    return reactionEntity;
  }

  public async deleteReaction(props: DeleteReactionProps): Promise<void> {
    const { target, targetId, reactionName, userId } = props;

    const conditions = {
      reactionName,
      createdBy: userId,
    };

    switch (target) {
      case REACTION_TARGET.COMMENT:
        conditions['commentId'] = targetId;
        break;
      case REACTION_TARGET.POST:
      case REACTION_TARGET.ARTICLE:
        conditions['postId'] = targetId;
        break;
      default:
        break;
    }

    const reaction =
      target === REACTION_TARGET.COMMENT
        ? await this._commentReactionRepository.findOne(conditions)
        : await this._postReactionRepository.findOne(conditions);
    if (!reaction) {
      throw new ReactionNotFoundException();
    }

    if (reaction.get('createdBy') !== userId) {
      throw new ReactionNotHaveAuthorityException();
    }

    if (target === REACTION_TARGET.POST || target === REACTION_TARGET.ARTICLE) {
      await this._postReactionRepository.delete(reaction.get('id'));
    } else if (target === REACTION_TARGET.COMMENT) {
      await this._commentReactionRepository.delete(reaction.get('id'));
    }

    this.eventBus.publish(new ReactionNotifyEvent(reaction, 'delete'));
  }
}
