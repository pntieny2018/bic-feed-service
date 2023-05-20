import { Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { v4 } from 'uuid';
import { CreateReactionOptions, IReactionFactory } from './reaction.factory.interface';
import { ReactionEntity, ReactionProps } from '../../model/reaction';

export class ReactionFactory implements IReactionFactory {
  @Inject(EventPublisher) private readonly _eventPublisher: EventPublisher;

  public create(options: CreateReactionOptions): ReactionEntity {
    return this._eventPublisher.mergeObjectContext(
      new ReactionEntity({
        id: v4(),
        createdAt: new Date(),
        target: options.target,
        targetId: options.targetId,
        reactionName: options.reactionName,
        createdBy: options.createdBy,
      })
    );
  }
  public reconstitute(properties: ReactionProps): ReactionEntity {
    return new ReactionEntity(properties);
  }
}
