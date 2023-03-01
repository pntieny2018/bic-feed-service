import { CommentReactionEntity, PostReactionEntity } from '../../model/reaction';
import { ReactionEnum } from '../../../../reaction/reaction.enum';
import { ReactionEntity } from '../../model/reaction/reaction.entity';

export type ReactionCreateProps = {
  reactionName: string;
  targetId: string;
  createdBy: string;
  target: ReactionEnum;
};

export type ReactionUpdateProps = {
  reactionName: string;
  id: string;
};

export interface IReactionDomainService {
  createReaction(data: ReactionCreateProps): Promise<ReactionEntity>;

  updateReaction(reaction: ReactionEntity, data: ReactionUpdateProps): Promise<ReactionEntity>;

  deleteReaction(id: string): Promise<void>;
}

export const REACTION_DOMAIN_SERVICE_TOKEN = 'REACTION_DOMAIN_SERVICE_TOKEN';
