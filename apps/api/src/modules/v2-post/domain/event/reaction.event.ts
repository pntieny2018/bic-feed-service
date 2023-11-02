import { ReactionHasBeenCreated, ReactionHasBeenRemoved } from '../../../../common/constants';
import { ReactionEntity } from '../model/reaction';

export class ReactionCreatedEvent {
  public static event = ReactionHasBeenCreated;

  public constructor(public readonly reactionEntity: ReactionEntity) {}
}

export class ReactionDeletedEvent {
  public static event = ReactionHasBeenRemoved;

  public constructor(public readonly reactionEntity: ReactionEntity) {}
}
