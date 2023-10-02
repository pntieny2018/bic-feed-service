import { CONTENT_TARGET } from '@beincom/constants';
import { CommentReactionAttributes } from '@libs/database/postgres/model/comment-reaction.model';
import { CommentAttributes } from '@libs/database/postgres/model/comment.model';
import { v4 } from 'uuid';

import { CommentEntity } from '../../domain/model/comment';
import { FileEntity, ImageEntity, VideoEntity } from '../../domain/model/media';
import { ReactionEntity } from '../../domain/model/reaction';

import { createMockPostRecord } from './content.mock';

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
    post: createMockPostRecord({ id: postId }),
    ...data,
  };
}

export function createMockCommentEntity(data: Partial<CommentAttributes> = {}): CommentEntity {
  const comment = createMockCommentRecord(data);
  return new CommentEntity({
    ...comment,
    media: {
      images: (comment.mediaJson?.images || []).map((image) => new ImageEntity(image)),
      files: (comment.mediaJson?.files || []).map((file) => new FileEntity(file)),
      videos: (comment.mediaJson?.videos || []).map((video) => new VideoEntity(video)),
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

export function createMockCommentReactionRecord(
  data: Partial<CommentReactionAttributes> = {}
): CommentReactionAttributes {
  return {
    id: v4(),
    commentId: v4(),
    reactionName: 'bic_check_mark',
    createdBy: v4(),
    createdAt: new Date(),
    ...data,
  };
}
