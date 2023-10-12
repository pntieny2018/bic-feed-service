import { CONTENT_TARGET } from '@beincom/constants';
import { CommentAttributes } from '@libs/database/postgres/model/comment.model';
import { v4 } from 'uuid';

import { CommentEntity } from '../../domain/model/comment';
import { FileEntity, ImageEntity, VideoEntity } from '../../domain/model/media';
import { ReactionEntity } from '../../domain/model/reaction';

export function createMockCommentRecord(data: Partial<CommentAttributes> = {}): CommentAttributes {
  const postId = v4();
  const ownerId = v4();
  const now = new Date();

  return {
    id: v4(),
    parentId: v4(),
    postId,
    content: 'This is a comment',
    totalReply: 0,
    edited: false,
    isHidden: false,
    giphyId: 'EZICHGrSD5QEFCxMiC',
    mediaJson: { files: [], images: [], videos: [] },
    mentions: [v4()],
    createdBy: ownerId,
    updatedBy: ownerId,
    updatedAt: now,
    createdAt: now,
    ...data,
  };
}

export function createMockCommentEntity(data: Partial<CommentAttributes> = {}): CommentEntity {
  const comment = createMockCommentRecord(data);
  const { mediaJson, ...restComment } = comment;

  return new CommentEntity({
    ...restComment,
    media: {
      images: (mediaJson?.images || []).map((image) => new ImageEntity(image)),
      files: (mediaJson?.files || []).map((file) => new FileEntity(file)),
      videos: (mediaJson?.videos || []).map((video) => new VideoEntity(video)),
    },
    ownerReactions: (comment?.ownerReactions || []).map(
      (reaction) =>
        new ReactionEntity({
          id: reaction.id,
          target: CONTENT_TARGET.COMMENT,
          targetId: comment.id,
          reactionName: reaction.reactionName,
          createdBy: reaction.createdBy,
          createdAt: reaction.createdAt,
        })
    ),
  });
}
