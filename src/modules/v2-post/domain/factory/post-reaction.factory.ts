import { PostReactionEntity, PostReactionProps } from '../model/reaction';
import { Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { v4 } from 'uuid';
import { IPostReactionFactory } from './post-reaction.factory.interface';

export class PostReactionFactory implements IPostReactionFactory {
  @Inject(EventPublisher) private readonly _eventPublisher: EventPublisher;

  public create(properties: PostReactionProps): PostReactionEntity {
    return this._eventPublisher.mergeObjectContext(
      new PostReactionEntity({ id: v4(), createdAt: new Date(), ...properties })
    );
  }
  public reconstitute(properties: PostReactionProps): PostReactionEntity {
    return new PostReactionEntity(properties);
  }
}
