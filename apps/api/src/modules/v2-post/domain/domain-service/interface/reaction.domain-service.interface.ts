import { ReactionEntity } from '../../model/reaction';
import { REACTION_TARGET } from '../../../data-type/reaction-target.enum';
import { ReactionsCount } from '../../../../../common/types/reaction-count.type';

export type ReactionCreateProps = {
  reactionName: string;
  targetId: string;
  createdBy: string;
  target: REACTION_TARGET;
};

export interface IReactionDomainService {
  createReaction(data: ReactionCreateProps): Promise<ReactionEntity>;

  deleteReaction(target: REACTION_TARGET, id: string): Promise<void>;

  getAndCountReactionByContents(contentIds: string[]): Promise<Map<string, ReactionsCount>>;
}

export const REACTION_DOMAIN_SERVICE_TOKEN = 'REACTION_DOMAIN_SERVICE_TOKEN';
