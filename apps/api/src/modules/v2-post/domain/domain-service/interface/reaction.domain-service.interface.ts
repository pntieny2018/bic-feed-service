import { CONTENT_TARGET, ORDER } from '@beincom/constants';
import { PaginationResult } from '@libs/database/postgres/common';
import { ReactionsCount } from 'apps/api/src/common/types';

import { ReactionEntity } from '../../model/reaction';

export type ReactionCreateProps = {
  reactionName: string;
  targetId: string;
  createdBy: string;
  target: CONTENT_TARGET;
};

export type GetReactionsProps = {
  reactionName: string;
  targetId: string;
  target: CONTENT_TARGET;
  latestId: string;
  order: ORDER;
  limit: number;
};

export type DeleteReactionProps = {
  userId: string;
  targetId: string;
  target: CONTENT_TARGET;
  reactionId?: string;
  reactionName: string;
};

export interface IReactionDomainService {
  getReactions(props: GetReactionsProps): Promise<PaginationResult<ReactionEntity>>;

  getAndCountReactionByContentIds(contentIds: string[]): Promise<Map<string, ReactionsCount>>;

  createReaction(data: ReactionCreateProps): Promise<ReactionEntity>;

  deleteReaction(props: DeleteReactionProps): Promise<void>;
}

export const REACTION_DOMAIN_SERVICE_TOKEN = 'REACTION_DOMAIN_SERVICE_TOKEN';
