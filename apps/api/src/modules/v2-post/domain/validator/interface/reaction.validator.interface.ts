import { CONTENT_TARGET } from '@beincom/constants';
import { UserDto } from '@libs/service/user';

export type CreateReactionValidatorPayload = {
  reactionName: string;
  target: CONTENT_TARGET;
  targetId: string;
  authUser: UserDto;
};

export interface IReactionValidator {
  validateCreateReaction(props: CreateReactionValidatorPayload): Promise<void>;
}

export const REACTION_VALIDATOR_TOKEN = 'REACTION_VALIDATOR_TOKEN';
