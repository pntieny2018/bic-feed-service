import { CONTENT_TARGET } from '@beincom/constants';
import {
  PostReactionAttributes,
  PostReactionModel,
} from '@libs/database/postgres/model/post-reaction.model';
import { Injectable } from '@nestjs/common';

import { ReactionEntity } from '../../domain/model/reaction';

@Injectable()
export class PostReactionMapper {
  public toDomain(model: PostReactionModel): ReactionEntity {
    if (model === null) {
      return null;
    }
    return new ReactionEntity({
      ...model.toJSON(),
      targetId: model.postId,
      target: CONTENT_TARGET.POST,
    });
  }

  public toPersistence(entity: ReactionEntity): PostReactionAttributes {
    return {
      id: entity.get('id'),
      postId: entity.get('targetId'),
      reactionName: entity.get('reactionName'),
      createdAt: entity.get('createdAt'),
      createdBy: entity.get('createdBy'),
    };
  }
}