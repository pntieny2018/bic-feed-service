import { CONTENT_TARGET } from '@beincom/constants';
import { PaginationResult } from '@libs/database/postgres/common';
import { Inject } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';

import { ContentHasSeenEvent, ReactionCreatedEvent, ReactionDeletedEvent } from '../event';
import {
  ReactionNotFoundException,
  ReactionNotHaveAuthorityException,
  ReactionTargetNotExistingException,
} from '../exception';
import {
  IReactionFactory,
  REACTION_FACTORY_TOKEN,
} from '../factory/interface/reaction.factory.interface';
import { ReactionEntity } from '../model/reaction';
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
} from './interface';

export class ReactionDomainService implements IReactionDomainService {
  public constructor(
    @Inject(POST_REACTION_REPOSITORY_TOKEN)
    private readonly _postReactionRepository: IPostReactionRepository,
    @Inject(COMMENT_REACTION_REPOSITORY_TOKEN)
    private readonly _commentReactionRepository: ICommentReactionRepository,
    @Inject(REACTION_FACTORY_TOKEN)
    private readonly _reactionFactory: IReactionFactory,
    private readonly eventBus: EventBus
  ) {}

  public async getReactions(props: GetReactionsProps): Promise<PaginationResult<ReactionEntity>> {
    switch (props.target) {
      case CONTENT_TARGET.COMMENT:
        return this._commentReactionRepository.getPagination(props);
      case CONTENT_TARGET.POST:
      case CONTENT_TARGET.ARTICLE:
        return this._postReactionRepository.getPagination(props);
      default:
        throw new ReactionTargetNotExistingException();
    }
  }

  public async getAndCountReactionByContentIds(
    contentIds: string[]
  ): Promise<Map<string, Record<string, number>[]>> {
    return this._postReactionRepository.getAndCountReactionByContents(contentIds);
  }

  public async createReaction(input: ReactionCreateProps): Promise<ReactionEntity> {
    const { reactionName, authUser, target, targetId } = input;
    const reactionEntity = this._reactionFactory.create({
      target,
      reactionName,
      createdBy: authUser.id,
      targetId: targetId,
    });

    switch (target) {
      case CONTENT_TARGET.POST:
      case CONTENT_TARGET.ARTICLE:
        await this._postReactionRepository.create(reactionEntity);
        this.eventBus.publish(
          new ContentHasSeenEvent({
            contentId: reactionEntity.get('targetId'),
            userId: reactionEntity.get('createdBy'),
          })
        );
        break;
      case CONTENT_TARGET.COMMENT:
        await this._commentReactionRepository.create(reactionEntity);
        break;
      default:
        throw new ReactionTargetNotExistingException();
    }

    this.eventBus.publish(new ReactionCreatedEvent({ reactionEntity }));
    return reactionEntity;
  }

  public async deleteReaction(props: DeleteReactionProps): Promise<void> {
    const { target, targetId, reactionName, userId } = props;

    const conditions = {
      reactionName,
      createdBy: userId,
    };

    switch (target) {
      case CONTENT_TARGET.COMMENT:
        conditions['commentId'] = targetId;
        break;
      case CONTENT_TARGET.POST:
      case CONTENT_TARGET.ARTICLE:
        conditions['postId'] = targetId;
        break;
      default:
        throw new ReactionTargetNotExistingException();
    }

    const reactionEntity =
      target === CONTENT_TARGET.COMMENT
        ? await this._commentReactionRepository.findOne(conditions)
        : await this._postReactionRepository.findOne(conditions);

    if (!reactionEntity) {
      throw new ReactionNotFoundException();
    }

    if (reactionEntity.get('createdBy') !== userId) {
      throw new ReactionNotHaveAuthorityException();
    }

    if (target === CONTENT_TARGET.COMMENT) {
      await this._commentReactionRepository.delete(reactionEntity.get('id'));
    } else {
      await this._postReactionRepository.delete(reactionEntity.get('id'));
    }

    this.eventBus.publish(new ReactionDeletedEvent({ reactionEntity }));
  }
}
