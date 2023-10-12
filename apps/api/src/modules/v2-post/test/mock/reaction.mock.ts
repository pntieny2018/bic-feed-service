import { CommentReactionAttributes } from '@libs/database/postgres/model';
import { v4 } from 'uuid';

import { REACTION_TARGET } from '../../data-type/reaction.enum';
import { ReactionAttributes, ReactionEntity } from '../../domain/model/reaction';

export function createMockReactionEntity(data: Partial<ReactionAttributes> = {}): ReactionEntity {
  return new ReactionEntity({
    id: v4(),
    target: REACTION_TARGET.COMMENT,
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
    target: REACTION_TARGET.COMMENT,
    targetId: commentReaction.commentId,
  });
}
