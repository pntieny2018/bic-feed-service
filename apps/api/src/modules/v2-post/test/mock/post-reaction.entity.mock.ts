import { ReactionEntity } from '../../domain/model/reaction';
import { REACTION_TARGET } from '../../data-type/reaction-target.enum';

export const mockReactionEntity = new ReactionEntity({
  id: '7b63852c-5249-499a-a32b-6bdaa2761fc1',
  reactionName: 'bic_check_mark',
  createdBy: '7b63852c-5249-499a-a32b-6bdaa2761fc2',
  createdAt: new Date(),
  target: REACTION_TARGET.POST,
  targetId: '7b63852c-5249-499a-a32b-6bdaa2761fc3',
});
