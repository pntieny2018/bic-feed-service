import { OrderEnum } from '../../../../../common/dto';
import { PaginationResult, ReactionsCount } from '../../../../../common/types';
import { REACTION_TARGET } from '../../../data-type';
import { ReactionEntity } from '../../model/reaction';

export type ReactionCreateProps = {
  reactionName: string;
  targetId: string;
  createdBy: string;
  target: REACTION_TARGET;
};

export type GetReactionsProps = {
  reactionName: string;
  targetId: string;
  target: string;
  latestId: string;
  order: OrderEnum;
  limit: number;
};

export type DeleteReactionProps = {
  userId: string;
  targetId: string;
  target: REACTION_TARGET;
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
