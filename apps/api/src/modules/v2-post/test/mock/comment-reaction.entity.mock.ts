import { ICommentReaction } from '../../../../database/models/comment-reaction.model';
import { ReactionEntity } from '../../domain/model/reaction';
import { REACTION_TARGET } from '../../data-type/reaction-target.enum';

export const commentReactionRecord: ICommentReaction = {
  id: '7b63852c-5249-499a-a32b-6bdaa2761fc1',
  commentId: '7b63852c-5249-499a-a32b-6bdaa2761fc3',
  reactionName: 'bic_check_mark',
  createdBy: '7b63852c-5249-499a-a32b-6bdaa2761fc2',
  createdAt: new Date(),
};

export const commentReactionEntity = new ReactionEntity({
  ...commentReactionRecord,
  target: REACTION_TARGET.COMMENT,
  targetId: commentReactionRecord.commentId,
});
