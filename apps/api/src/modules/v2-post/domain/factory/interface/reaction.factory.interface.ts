import { CONTENT_TARGET } from '@beincom/constants';

import { ReactionEntity, ReactionAttributes } from '../../model/reaction';

export type CreateReactionProps = Readonly<{
  target: CONTENT_TARGET;
  targetId: string;
  reactionName: string;
  createdBy: string;
}>;
export interface IReactionFactory {
  create(options: CreateReactionProps): ReactionEntity;
  reconstitute(props: ReactionAttributes): ReactionEntity;
}
export const REACTION_FACTORY_TOKEN = 'REACTION_FACTORY_TOKEN';
