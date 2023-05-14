import { NIL, v4 } from 'uuid';
import { Inject, Injectable } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { CommentEntity, CommentProps } from '../model/comment';
import { CreateCommentProps, ICommentFactory } from './interface/comment.factory.interface';
import { FileEntity, ImageEntity, VideoEntity } from '../model/media';

@Injectable()
export class CommentFactory implements ICommentFactory {
  public constructor(@Inject(EventPublisher) private readonly _eventPublisher: EventPublisher) {}

  public createComment(props: CreateCommentProps): CommentEntity {
    const { userId, postId, content, media, giphyId, mentions } = props;
    const now = new Date();
    const entity = new CommentEntity({
      id: v4(),
      parentId: NIL,
      postId,
      content,
      createdBy: userId,
      updatedBy: userId,
      media: {
        images: media.images.map((image) => new ImageEntity(image)),
        files: media.files.map((file) => new FileEntity(file)),
        videos: media.videos.map((video) => new VideoEntity(video)),
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

  public reconstitute(properties: CommentProps): CommentEntity {
    return this._eventPublisher.mergeObjectContext(new CommentEntity(properties));
  }
}
