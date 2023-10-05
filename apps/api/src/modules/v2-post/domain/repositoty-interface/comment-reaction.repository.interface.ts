import { ReactionEntity } from '../model/reaction';
import { PaginationResult, ReactionsCount } from '../../../../common/types';
import { ORDER } from '@beincom/constants';

export type FindOneCommentReactionProps = {
  reactionName?: string;
  createdBy?: string;
  commentId?: string;
  id?: string;
};
export type GetPaginationCommentReactionProps = {
  reactionName: string;
  targetId: string;
  latestId: string;
  order: ORDER;
  limit: number;
};
export interface ICommentReactionRepository {
  findOne(input: FindOneCommentReactionProps): Promise<ReactionEntity>;

  create(data: ReactionEntity): Promise<void>;

  delete(id: string): Promise<void>;
  getPagination(
    input: GetPaginationCommentReactionProps
  ): Promise<PaginationResult<ReactionEntity>>;

  getAndCountReactionByComments(commentIds: string[]): Promise<Map<string, ReactionsCount>>;
}

export const COMMENT_REACTION_REPOSITORY_TOKEN = 'COMMENT_REACTION_REPOSITORY_TOKEN';
