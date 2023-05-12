import { v4 } from 'uuid';
import { Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { CommentEntity } from '../model/Comment';
import { CreateCommentProps, ICommentFactory } from './interface/comment.factory.interface';

export class CommentFactory implements ICommentFactory {
  @Inject(EventPublisher) private readonly _eventPublisher: EventPublisher;

  public createComment(props: CreateCommentProps): CommentEntity {
    const { userId, postId, content, media, giphyId } = props;
    const now = new Date();
    const entity = new CommentEntity({
      id: v4(),
      postId,
      content,
      createdBy: userId,
      updatedBy: userId,
      media,
      isHidden: false,
      edited: false,
      createdAt: now,
      updatedAt: now,
      giphyId,
    });

    return this._eventPublisher.mergeObjectContext(entity);
  }
}
