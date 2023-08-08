import { ReactionEntity, ReactionAttributes } from '../../model/reaction';
import { REACTION_TARGET } from '../../../data-type';

export type CreateReactionProps = Readonly<{
  target: REACTION_TARGET;
  targetId: string;
  reactionName: string;
  createdBy: string;
}>;
export interface IReactionFactory {
  create(options: CreateReactionProps): ReactionEntity;
  reconstitute(props: ReactionAttributes): ReactionEntity;
}
export const REACTION_FACTORY_TOKEN = 'REACTION_FACTORY_TOKEN';
