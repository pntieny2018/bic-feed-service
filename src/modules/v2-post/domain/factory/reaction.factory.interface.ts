import { ReactionEntity, ReactionProps } from '../model/reaction';

export type CreateReactionOptions = Readonly<{
  targetId: string;
  reactionName: string;
  createdBy: string;
}>;
export interface IReactionFactory {
  create(options: CreateReactionOptions): ReactionEntity;
  reconstitute(props: ReactionProps): ReactionEntity;
}
export const REACTION_FACTORY_TOKEN = 'POST_REACTION_FACTORY_TOKEN';
