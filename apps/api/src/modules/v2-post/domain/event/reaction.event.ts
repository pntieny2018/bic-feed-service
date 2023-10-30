import { ReactionEntity } from '../model/reaction';

export class ReactionEvent {
  public constructor(
    public readonly reactionEntity: ReactionEntity,
    public readonly action: 'create' | 'delete'
  ) {}
}
