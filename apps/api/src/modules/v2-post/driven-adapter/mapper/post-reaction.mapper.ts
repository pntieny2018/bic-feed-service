import { CONTENT_TARGET } from '@beincom/constants';
import {
  PostReactionAttributes,
  PostReactionModel,
} from '@libs/database/postgres/model/post-reaction.model';
import { Inject, Injectable } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';

import { REACTION_TARGET } from '../../data-type';
import { ReactionEntity } from '../../domain/model/reaction';

@Injectable()
export class PostReactionMapper {
  public constructor(@Inject(EventPublisher) private readonly _eventPublisher: EventPublisher) {}

  public toDomain(model: PostReactionModel): ReactionEntity {
    if (model === null) {
      return null;
    }
    return this._eventPublisher.mergeObjectContext(
      new ReactionEntity({
        ...model.toJSON(),
        targetId: model.postId,
        target: CONTENT_TARGET.POST as unknown as REACTION_TARGET,
      })
    );
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
