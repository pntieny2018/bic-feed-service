import { v4 } from 'uuid';
import { Inject, Injectable } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { CommentEntity, CommentAttributes } from '../model/comment';
import { BasedCommentProps, ICommentFactory } from './interface';

@Injectable()
export class CommentFactory implements ICommentFactory {
  public constructor(@Inject(EventPublisher) private readonly _eventPublisher: EventPublisher) {}

  public createComment(props: BasedCommentProps): CommentEntity {
    const { userId, parentId, postId, content, giphyId, mentions } = props;
    const now = new Date();
    const entity = new CommentEntity({
      id: v4(),
      parentId,
      postId,
      content,
      createdBy: userId,
      updatedBy: userId,
      media: {
        files: [],
        images: [],
        videos: [],
      },
      mentions: mentions,
      isHidden: false,
      edited: false,
      createdAt: now,
      updatedAt: now,
      giphyId,
    });

    return this._eventPublisher.mergeObjectContext(entity);
  }

  public reconstitute(properties: CommentAttributes): CommentEntity {
    return this._eventPublisher.mergeObjectContext(new CommentEntity(properties));
  }
}
