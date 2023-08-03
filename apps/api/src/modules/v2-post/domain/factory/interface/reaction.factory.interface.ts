import { ReactionEntity, ReactionProps } from '../../model/reaction';
import { REACTION_TARGET } from '../../../data-type';

export type CreateReactionOptions = Readonly<{
  target: REACTION_TARGET;
  targetId: string;
  reactionName: string;
  createdBy: string;
}>;
export interface IReactionFactory {
  create(options: CreateReactionOptions): ReactionEntity;
  reconstitute(props: ReactionProps): ReactionEntity;
}
export const REACTION_FACTORY_TOKEN = 'REACTION_FACTORY_TOKEN';
