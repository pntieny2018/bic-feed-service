export type ReactionCreateProps = {
  reactionName: string;
  targetId: string;
};

export type ReactionUpdateProps = {
  reactionName: string;
  id: string;
};

export interface IReactionDomainService {
  createReaction(data: ReactionCreateProps): Promise<void>;

  updateReaction(data: ReactionUpdateProps): Promise<void>;

  deleteReaction(id: string): Promise<void>;
}

export const REACTION_DOMAIN_SERVICE_TOKEN = 'REACTION_DOMAIN_SERVICE_TOKEN';
