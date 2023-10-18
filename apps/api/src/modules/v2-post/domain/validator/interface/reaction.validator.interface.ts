import { CONTENT_TARGET } from '@beincom/constants';

export type CreateReactionValidatorPayload = {
  reactionName: string;
  target: CONTENT_TARGET;
  targetId: string;
  createdBy: string;
};

export interface IReactionValidator {
  validateCreateReaction(props: CreateReactionValidatorPayload): Promise<void>;
}

export const REACTION_VALIDATOR_TOKEN = 'REACTION_VALIDATOR_TOKEN';
