import { ReactionEntity } from '../../model/reaction';
import { REACTION_TARGET } from '../../../data-type/reaction.enum';

export type ReactionCreateProps = {
  reactionName: string;
  targetId: string;
  createdBy: string;
  target: REACTION_TARGET;
};

export interface IReactionDomainService {
  createReaction(data: ReactionCreateProps): Promise<ReactionEntity>;

  deleteReaction(target: REACTION_TARGET, id: string): Promise<void>;
}

export const REACTION_DOMAIN_SERVICE_TOKEN = 'REACTION_DOMAIN_SERVICE_TOKEN';
