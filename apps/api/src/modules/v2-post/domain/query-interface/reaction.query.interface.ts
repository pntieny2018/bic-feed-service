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
export interface IReactionQuery {
  getPagination(input: GetReactionProps): Promise<PaginationResult<ReactionEntity>>;
}

export const REACTION_QUERY_TOKEN = 'REACTION_QUERY_TOKEN';
