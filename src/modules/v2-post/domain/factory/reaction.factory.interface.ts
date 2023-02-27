import { ReactionEntity, ReactionProps } from '../model/reaction';

export interface IReactionFactory {
  reconstitute(props: ReactionProps): ReactionEntity;
}
export const REACTION_FACTORY_TOKEN = 'REACTION_FACTORY_TOKEN';
