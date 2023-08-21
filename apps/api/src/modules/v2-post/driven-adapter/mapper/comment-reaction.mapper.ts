import { CONTENT_TARGET } from '@beincom/constants';
import {
  CommentReactionAttributes,
  CommentReactionModel,
} from '@libs/database/postgres/model/comment-reaction.model';
import { Injectable } from '@nestjs/common';

import { ReactionEntity } from '../../domain/model/reaction';

@Injectable()
export class CommentReactionMapper {
  public toDomain(model: CommentReactionModel): ReactionEntity {
    if (model === null) {
      return null;
    }
    return new ReactionEntity({
      ...model.toJSON(),
      targetId: model.commentId,
      target: CONTENT_TARGET.COMMENT,
    });
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
