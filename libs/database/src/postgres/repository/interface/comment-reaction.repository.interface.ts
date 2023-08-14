import {
  CommentReactionAttributes,
  CommentReactionModel,
} from '@libs/database/postgres/model/comment-reaction.model';

export type FindOneCommentReactionProps = {
  reactionName?: string;
  createdBy?: string;
  commentId?: string;
  id?: string;
};

export interface ILibCommentReactionRepository {
  findOne(input: FindOneCommentReactionProps): Promise<CommentReactionModel>;

  create(data: CommentReactionAttributes): Promise<void>;

  delete(id: string): Promise<void>;
}

export const LIB_COMMENT_REACTION_REPOSITORY_TOKEN = 'LIB_COMMENT_REACTION_REPOSITORY_TOKEN';
