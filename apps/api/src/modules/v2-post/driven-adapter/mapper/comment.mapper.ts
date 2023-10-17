import { CONTENT_TARGET } from '@beincom/constants';
import { CommentAttributes, CommentModel } from '@libs/database/postgres/model/comment.model';
import { Injectable } from '@nestjs/common';

import { CommentEntity } from '../../domain/model/comment';
import { FileEntity, ImageEntity, VideoEntity } from '../../domain/model/media';
import { ReactionEntity } from '../../domain/model/reaction';

@Injectable()
export class CommentMapper {
  public toDomain(model: CommentModel): CommentEntity {
    if (model === null) {
      return null;
    }
    return new CommentEntity({
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
      mentions: model.mentions,
      media: {
        images: (model.mediaJson?.images || []).map((image) => new ImageEntity(image)),
        files: (model.mediaJson?.files || []).map((file) => new FileEntity(file)),
        videos: (model.mediaJson?.videos || []).map((video) => new VideoEntity(video)),
      },
      ownerReactions: (model?.ownerReactions || []).map(
        (reaction) =>
          new ReactionEntity({
            id: reaction.id,
            target: CONTENT_TARGET.COMMENT,
            targetId: model.id,
            reactionName: reaction.reactionName,
            createdBy: reaction.createdBy,
            createdAt: reaction.createdAt,
          })
      ),
    });
  }

  public toPersistence(comment: CommentEntity): CommentAttributes {
    return {
      id: comment.get('id'),
      edited: comment.get('edited'),
      totalReply: comment.get('totalReply') || 0,
      createdAt: comment.get('createdAt'),
      updatedAt: comment.get('updatedAt'),
      content: comment.get('content'),
      postId: comment.get('postId'),
      parentId: comment.get('parentId'),
      isHidden: comment.get('isHidden'),
      updatedBy: comment.get('updatedBy'),
      createdBy: comment.get('createdBy'),
      giphyId: comment.get('giphyId'),
      mediaJson: {
        files: (comment.get('media').files || []).map((file) => file.toObject()),
        images: (comment.get('media').images || []).map((image) => image.toObject()),
        videos: (comment.get('media').videos || []).map((video) => video.toObject()),
      },
      mentions: comment.get('mentions'),
    };
  }
}
