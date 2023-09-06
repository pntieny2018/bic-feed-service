import { ReactionsCount, PaginationResult } from '../../../../common/types';
import { ReactionEntity } from '../model/reaction';

export type GetReactionProps = {
  reactionName: string;
  targetId: string;
  target: string;
  latestId: string;
  order: string;
  limit: number;
};

export interface IReactionRepository {
  getPagination(input: GetReactionProps): Promise<PaginationResult<ReactionEntity>>;

  getAndCountReactionByComments(commentIds: string[]): Promise<Map<string, ReactionsCount>>;
  getAndCountReactionByContents(contentIds: string[]): Promise<Map<string, ReactionsCount>>;
}

export const REACTION_REPOSITORY_TOKEN = 'REACTION_REPOSITORY_TOKEN';
