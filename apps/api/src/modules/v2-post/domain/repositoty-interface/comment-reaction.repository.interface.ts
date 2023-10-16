import { ReactionEntity } from '../model/reaction';

export type FindOneCommentReactionProps = {
  reactionName?: string;
  createdBy?: string;
  commentId?: string;
  id?: string;
};

export interface ICommentReactionRepository {
  findOne(input: FindOneCommentReactionProps): Promise<ReactionEntity>;

  create(data: ReactionEntity): Promise<void>;

  delete(id: string): Promise<void>;
}

export const COMMENT_REACTION_REPOSITORY_TOKEN = 'COMMENT_REACTION_REPOSITORY_TOKEN';
