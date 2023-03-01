import { CommentReactionEntity, CommentReactionProps } from '../model/reaction';
import { Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { v4 } from 'uuid';

export class CommentReactionFactory {
  @Inject(EventPublisher) private readonly _eventPublisher: EventPublisher;

  public create(properties: CommentReactionProps): CommentReactionEntity {
    return this._eventPublisher.mergeObjectContext(
      new CommentReactionEntity({ id: v4(), createdAt: new Date(), ...properties })
    );
  }
  public reconstitute(properties: CommentReactionProps): CommentReactionEntity {
    return new CommentReactionEntity(properties);
  }
}
