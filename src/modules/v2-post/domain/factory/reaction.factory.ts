import { ReactionEntity, ReactionProps } from '../model/reaction';
import { Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { v4 } from 'uuid';
import { CreateReactionOptions, IReactionFactory } from './reaction.factory.interface';

export class ReactionFactory implements IReactionFactory {
  @Inject(EventPublisher) private readonly _eventPublisher: EventPublisher;

  public create(properties: CreateReactionOptions): ReactionEntity {
    return this._eventPublisher.mergeObjectContext(
      new ReactionEntity({ id: v4(), createdAt: new Date(), ...properties })
    );
  }
  public reconstitute(properties: ReactionProps): ReactionEntity {
    return new ReactionEntity(properties);
  }
}
