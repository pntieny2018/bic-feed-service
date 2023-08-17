import { CONTENT_TARGET } from '@beincom/constants';
import {
  CommentAttributes,
  CommentModel,
  IImage,
} from '@libs/database/postgres/model/comment.model';
import { Inject, Injectable } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';

import { REACTION_TARGET } from '../../data-type';
import { CommentEntity } from '../../domain/model/comment';
import { FileEntity, ImageAttributes, ImageEntity, VideoEntity } from '../../domain/model/media';
import { ReactionEntity } from '../../domain/model/reaction';

@Injectable()
export class CommentMapper {
  public constructor(@Inject(EventPublisher) private readonly _eventPublisher: EventPublisher) {}

  public toDomain(model: CommentModel): CommentEntity {
    if (model === null) {
      return null;
    }
    return this._eventPublisher.mergeObjectContext(
      new CommentEntity({
        id: model.id,
        postId: model.postId,
        parentId: model.parentId,
        edited: model.edited,
        isHidden: model.isHidden,
        giphyId: model.giphyId,
        totalReply: model.totalReply,
        createdBy: model.createdBy,
        updatedBy: model.updatedBy,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
        content: model.content,
        childs: {
          rows: model.child?.map((item) => this.toDomain(item)) || [],
          meta: {},
        },
        mentions: model.mentions,
        media: {
          images: model.mediaJson?.images.map(
            (image) => new ImageEntity(image as unknown as ImageAttributes)
          ),
          files: model.mediaJson?.files.map((file) => new FileEntity(file)),
          videos: model.mediaJson?.videos.map((video) => new VideoEntity(video)),
        },
        ownerReactions: (model?.ownerReactions || []).map(
          (reaction) =>
            new ReactionEntity({
              id: reaction.id,
              target: CONTENT_TARGET.COMMENT as unknown as REACTION_TARGET,
              targetId: model.id,
              reactionName: reaction.reactionName,
              createdBy: reaction.createdBy,
              createdAt: reaction.createdAt,
            })
        ),
      })
    );
  }

  public toPersistence(comment: CommentEntity): CommentAttributes {
    return {
      id: comment.get('id'),
      actor: undefined,
      child: [],
      createdAt: undefined,
      edited: false,
      ownerReactions: [],
      parent: undefined,
      post: undefined,
      reactionsCount: '',
      totalReply: 0,
      updatedAt: undefined,
      content: comment.get('content'),
      postId: comment.get('postId'),
      parentId: comment.get('parentId'),
      isHidden: comment.get('isHidden'),
      updatedBy: comment.get('updatedBy'),
      createdBy: comment.get('createdBy'),
      giphyId: comment.get('giphyId'),
      mediaJson: {
        files: comment.get('media').files.map((file) => file.toObject()),
        images: comment.get('media').images.map((image) => image.toObject() as unknown as IImage),
        videos: comment.get('media').videos.map((video) => video.toObject()),
      },
      mentions: comment.get('mentions'),
    };
  }
}
