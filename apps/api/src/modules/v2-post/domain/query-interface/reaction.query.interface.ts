import { ReactionEntity } from '../model/reaction';
import { PaginationResult } from '../../../../common/types/pagination-result.type';

export type GetReactionProps = {
  reactionName: string;
  targetId: string;
  target: string;
  latestId: string;
  order: string;
  limit: number;
};

export type ReactionsCount = Record<string, number>[];
export interface IReactionQuery {
  getPagination(input: GetReactionProps): Promise<PaginationResult<ReactionEntity>>;

  getAndCountReactionByComments(commentIds: string[]): Promise<Map<string, ReactionsCount>>;
  getAndCountReactionByContents(contentIds: string[]): Promise<Map<string, ReactionsCount>>;
}

export const REACTION_QUERY_TOKEN = 'REACTION_QUERY_TOKEN';
