import { ORDER } from '@beincom/constants';
import { PaginationResult } from '@libs/database/postgres/common';

import { ReactionsCount } from '../../../../common/types';
import { ReactionEntity } from '../model/reaction';

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

export type UpdateCountCommentReactionProps = {
  reactionName: string;
  commentId: string;
  action: 'create' | 'delete';
};

export interface ICommentReactionRepository {
  findOne(input: FindOneCommentReactionProps): Promise<ReactionEntity>;

  create(data: ReactionEntity): Promise<void>;

  delete(id: string): Promise<void>;
  getPagination(
    input: GetPaginationCommentReactionProps
  ): Promise<PaginationResult<ReactionEntity>>;

  getAndCountReactionByComments(commentIds: string[]): Promise<Map<string, ReactionsCount>>;

  updateCountReaction(props: UpdateCountCommentReactionProps): Promise<void>;
}

export const COMMENT_REACTION_REPOSITORY_TOKEN = 'COMMENT_REACTION_REPOSITORY_TOKEN';
