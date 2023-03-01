import { CommentReactionEntity } from '../model/reaction';

export type FindOneCommentReactionProps = {
  reactionName: string;
  createdBy: string;
  commentId: string;
};

export interface ICommentReactionRepository {
  // findAll(input: FindAllReactionsProps): Promise<ReactionEntity[]>;

  findOne(input: FindOneCommentReactionProps): Promise<CommentReactionEntity>;

  create(data: CommentReactionEntity): Promise<void>;

  delete(id: string): Promise<void>;
}

export const COMMENT_REACTION_REPOSITORY_TOKEN = 'COMMENT_REACTION_REPOSITORY_TOKEN';
