import { CONTENT_TARGET } from '@beincom/constants';
import { CommentReactionAttributes, PostReactionAttributes } from '@libs/database/postgres/model';
import { v4 } from 'uuid';

import { ReactionAttributes, ReactionEntity } from '../../domain/model/reaction';

export function createMockReactionEntity(data: Partial<ReactionAttributes> = {}): ReactionEntity {
  return new ReactionEntity({
    id: v4(),
    target: CONTENT_TARGET.COMMENT,
    targetId: v4(),
    reactionName: 'bic_check_mark',
    createdBy: v4(),
    createdAt: new Date(),
    ...data,
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

export function createMockCommentReactionEntity(
  data: Partial<CommentReactionAttributes> = {}
): ReactionEntity {
  const commentReaction = createMockCommentReactionRecord(data);
  return new ReactionEntity({
    ...commentReaction,
    target: CONTENT_TARGET.COMMENT,
    targetId: commentReaction.commentId,
  });
}

export function createMockPostReactionRecord(
  data: Partial<PostReactionAttributes> = {}
): PostReactionAttributes {
  return {
    id: v4(),
    postId: v4(),
    reactionName: 'bic_check_mark',
    target: CONTENT_TARGET.POST,
    createdBy: v4(),
    createdAt: new Date(),
    ...data,
  };
}

export function createMockPostReactionEntity(
  data: Partial<PostReactionAttributes> = {}
): ReactionEntity {
  const postReaction = createMockPostReactionRecord(data);
  return new ReactionEntity({
    ...postReaction,
    target: CONTENT_TARGET.POST,
    targetId: postReaction.postId,
  });
}
