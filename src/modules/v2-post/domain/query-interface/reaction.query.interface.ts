import { ReactionEntity } from '../model/reaction/reaction.entity';
import { PaginationResult } from '../../../../common/types/pagination-result.type';

export type GetReactionProps = {
  groupIds: string[];
  name?: string;
};
export interface IReactionQuery {
  getPagination(input: GetReactionProps): Promise<PaginationResult<ReactionEntity>>;
}

export const REACTION_QUERY_TOKEN = 'REACTION_QUERY_TOKEN';
