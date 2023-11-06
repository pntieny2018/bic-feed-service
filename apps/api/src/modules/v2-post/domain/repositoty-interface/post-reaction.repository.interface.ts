import { ORDER } from '@beincom/constants';
import { PaginationResult } from '@libs/database/postgres/common';

import { ReactionsCount } from '../../../../common/types';
import { ReactionEntity } from '../model/reaction';

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

export type UpdateCountContentReactionProps = {
  reactionName: string;
  contentId: string;
};

export interface IPostReactionRepository {
  findOne(input: FindOnePostReactionProps): Promise<ReactionEntity>;

  create(data: ReactionEntity): Promise<void>;

  delete(id: string): Promise<void>;
  getPagination(input: GetPaginationPostReactionProps): Promise<PaginationResult<ReactionEntity>>;
  getAndCountReactionByContents(contentIds: string[]): Promise<Map<string, ReactionsCount>>;
  increaseReactionCount(props: UpdateCountContentReactionProps): Promise<void>;
  decreaseReactionCount(props: UpdateCountContentReactionProps): Promise<void>;
}

export const POST_REACTION_REPOSITORY_TOKEN = 'POST_REACTION_REPOSITORY_TOKEN';
