import { ReactionEntity } from '../model/reaction';

export class ReactionCreatedEvent {
  public constructor(public readonly reactionEntity: ReactionEntity) {}
}

export class ReactionDeletedEvent {
  public constructor(public readonly reactionEntity: ReactionEntity) {}
}
