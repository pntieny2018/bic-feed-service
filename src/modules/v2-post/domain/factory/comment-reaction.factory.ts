import { CommentReactionEntity, CommentReactionProps } from '../model/reaction';
import { Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { v4 } from 'uuid';
import { ICommentReactionFactory } from './comment-reaction.factory.interface';

export class CommentReactionFactory implements ICommentReactionFactory {
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
