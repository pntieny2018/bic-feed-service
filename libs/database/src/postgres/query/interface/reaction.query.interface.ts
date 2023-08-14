import { PaginationResult } from '@libs/database/postgres/common';
import { CommentReactionModel } from '@libs/database/postgres/model/comment-reaction.model';

import { PostReactionModel } from '../../model/post-reaction.model';

export type GetReactionProps = {
  reactionName: string;
  targetId: string;
  target: string;
  latestId: string;
  order: string;
  limit: number;
};

export type ReactionsCount = Record<string, number>[];
export interface ILibReactionQuery {
  getPagination(
    input: GetReactionProps
  ): Promise<PaginationResult<PostReactionModel | CommentReactionModel>>;

  getAndCountReactionByComments(commentIds: string[]): Promise<Map<string, ReactionsCount>>;
  getAndCountReactionByContents(contentIds: string[]): Promise<Map<string, ReactionsCount>>;
}

export const LIB_REACTION_QUERY_TOKEN = 'LIB_REACTION_QUERY_TOKEN';
