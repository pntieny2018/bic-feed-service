import { PaginationResult } from '@libs/database/postgres/common';
import { PostReactionModel, CommentReactionModel } from '@libs/database/postgres/model';

export type GetReactionProps = {
  reactionName: string;
  targetId: string;
  target: string;
  latestId: string;
  order: string;
  limit: number;
};

export type ReactionsCount = Record<string, number>[];
export interface ILibReactionRepository {
  getPagination(
    input: GetReactionProps
  ): Promise<PaginationResult<PostReactionModel | CommentReactionModel>>;

  getAndCountReactionByComments(commentIds: string[]): Promise<Map<string, ReactionsCount>>;
  getAndCountReactionByContents(contentIds: string[]): Promise<Map<string, ReactionsCount>>;
}

export const LIB_REACTION_REPOSITORY_TOKEN = 'LIB_REACTION_REPOSITORY_TOKEN';
