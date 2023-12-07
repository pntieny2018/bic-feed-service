import { CONTENT_TARGET } from '@beincom/constants';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { ReactionDeletedEvent } from '../../../domain/event';
import {
  COMMENT_REACTION_REPOSITORY_TOKEN,
  ICommentReactionRepository,
  IPostReactionRepository,
  POST_REACTION_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface';

@EventsHandlerAndLog(ReactionDeletedEvent)
export class DecreaseReactionCountEventHandler implements IEventHandler<ReactionDeletedEvent> {
  public constructor(
    @Inject(COMMENT_REACTION_REPOSITORY_TOKEN)
    private readonly _commentReactionRepository: ICommentReactionRepository,
    @Inject(POST_REACTION_REPOSITORY_TOKEN)
    private readonly _postReactionRepository: IPostReactionRepository
  ) {}

  public async handle(event: ReactionDeletedEvent): Promise<void> {
    const { reactionEntity } = event.payload;

    switch (reactionEntity.get('target')) {
      case CONTENT_TARGET.COMMENT:
        await this._commentReactionRepository.decreaseReactionCount({
          commentId: reactionEntity.get('targetId'),
          reactionName: reactionEntity.get('reactionName'),
        });
        break;
      case CONTENT_TARGET.POST:
      case CONTENT_TARGET.ARTICLE:
        await this._postReactionRepository.decreaseReactionCount({
          contentId: reactionEntity.get('targetId'),
          reactionName: reactionEntity.get('reactionName'),
        });
        break;
      default:
        break;
    }
  }
}
