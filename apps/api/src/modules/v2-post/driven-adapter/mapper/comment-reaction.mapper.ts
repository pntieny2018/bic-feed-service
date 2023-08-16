import { CONTENT_TARGET } from '@beincom/constants';
import {
  CommentReactionAttributes,
  CommentReactionModel,
} from '@libs/database/postgres/model/comment-reaction.model';
import { Inject, Injectable } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';

import { REACTION_TARGET } from '../../data-type';
import { ReactionEntity } from '../../domain/model/reaction';

@Injectable()
export class CommentReactionMapper {
  public constructor(@Inject(EventPublisher) private readonly _eventPublisher: EventPublisher) {}

  public toDomain(model: CommentReactionModel): ReactionEntity {
    if (model === null) {
      return null;
    }
    return this._eventPublisher.mergeObjectContext(
      new ReactionEntity({
        ...model.toJSON(),
        targetId: model.commentId,
        target: CONTENT_TARGET.COMMENT as unknown as REACTION_TARGET,
      })
    );
  }

  public toPersistence(domain: ReactionEntity): CommentReactionAttributes {
    return {
      id: domain.get('id'),
      commentId: domain.get('targetId'),
      reactionName: domain.get('reactionName'),
      createdAt: domain.get('createdAt'),
      createdBy: domain.get('createdBy'),
    };
  }
}
