import { ReactionEntity } from '../model/reaction';

export class ReactionNotifyEvent {
  public constructor(
    public readonly reactionEntity: ReactionEntity,
    public readonly action: 'create' | 'delete'
  ) {}
}
