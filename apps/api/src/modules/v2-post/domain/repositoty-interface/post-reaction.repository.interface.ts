import { ReactionEntity } from '../model/reaction';
import { PaginationResult, ReactionsCount } from '../../../../common/types';
import { ORDER } from '@beincom/constants';

export type FindOnePostReactionProps = {
  reactionName?: string;
  createdBy?: string;
  postId?: string;
  id?: string;
};

export type GetPaginationPostReactionProps = {
  reactionName: string;
  targetId: string;
  latestId: string;
  order: ORDER;
  limit: number;
};
export interface IPostReactionRepository {
  findOne(input: FindOnePostReactionProps): Promise<ReactionEntity>;

  create(data: ReactionEntity): Promise<void>;

  delete(id: string): Promise<void>;
  getPagination(input: GetPaginationPostReactionProps): Promise<PaginationResult<ReactionEntity>>;
  getAndCountReactionByContents(contentIds: string[]): Promise<Map<string, ReactionsCount>>;
}

export const POST_REACTION_REPOSITORY_TOKEN = 'POST_REACTION_REPOSITORY_TOKEN';
