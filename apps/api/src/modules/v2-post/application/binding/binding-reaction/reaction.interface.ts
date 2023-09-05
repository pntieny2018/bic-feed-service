import { ReactionEntity } from '../../../domain/model/reaction';
import { ReactionDto } from '../../dto';

export interface IReactionBinding {
  binding(reactionEntity: ReactionEntity): Promise<ReactionDto>;
}
export const REACTION_BINDING_TOKEN = 'REACTION_BINDING_TOKEN';
