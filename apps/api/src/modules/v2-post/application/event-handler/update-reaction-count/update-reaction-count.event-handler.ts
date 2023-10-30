import { CONTENT_TARGET } from '@beincom/constants';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { ReactionEvent } from '../../../domain/event';
import { ReactionEntity } from '../../../domain/model/reaction';
import {
  COMMENT_REACTION_REPOSITORY_TOKEN,
  ICommentReactionRepository,
  IPostReactionRepository,
  POST_REACTION_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface';

@EventsHandlerAndLog(ReactionEvent)
export class ReactionCountEventHandler implements IEventHandler<ReactionEvent> {
  public constructor(
    @Inject(COMMENT_REACTION_REPOSITORY_TOKEN)
    private readonly _commentReactionRepository: ICommentReactionRepository,
    @Inject(POST_REACTION_REPOSITORY_TOKEN)
    private readonly _postReactionRepository: IPostReactionRepository
  ) {}

  public async handle(event: ReactionEvent): Promise<void> {
    const { reactionEntity, action } = event;

    switch (reactionEntity.get('target')) {
      case CONTENT_TARGET.COMMENT:
        await this._updateCommentReactionCount(reactionEntity, action);
        break;
      case CONTENT_TARGET.POST:
      case CONTENT_TARGET.ARTICLE:
        await this._updateContentReactionCount(reactionEntity, action);
        break;
      default:
        break;
    }
  }

  private async _updateContentReactionCount(
    reactionEntity: ReactionEntity,
    action: 'create' | 'delete'
  ): Promise<void> {
    await this._postReactionRepository.updateCountReaction({
      contentId: reactionEntity.get('targetId'),
      reactionName: reactionEntity.get('reactionName'),
      action,
    });
  }

  private async _updateCommentReactionCount(
    reactionEntity: ReactionEntity,
    action: 'create' | 'delete'
  ): Promise<void> {
    await this._commentReactionRepository.updateCountReaction({
      commentId: reactionEntity.get('targetId'),
      reactionName: reactionEntity.get('reactionName'),
      action,
    });
  }
}
