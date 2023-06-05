import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { validate as isUUID } from 'uuid';
import { emoji } from 'node-emoji';
import { BIC_EMOJI } from '../../../../reaction/reaction.constant';
import { REACTION_TARGET } from '../../../data-type/reaction-target.enum';
export type ReactionProps = {
  id: string;
  target: REACTION_TARGET;
  targetId: string;
  reactionName: string;
  createdBy: string;
  createdAt?: Date;
};
export class ReactionEntity extends DomainAggregateRoot<ReactionProps> {
  public constructor(props: ReactionProps) {
    super(props);
  }

  public validate(): void {
    if (!isUUID(this._props.id)) {
      throw new Error('Reaction ID is not UUID');
    }
    if (this._props.targetId && !isUUID(this._props.targetId)) {
      throw new Error('Target ID is not UUID');
    }
    if (!isUUID(this._props.createdBy)) {
      throw new Error('Created By is not UUID');
    }
    if (![...BIC_EMOJI, ...Object.keys(emoji)].includes(this._props.reactionName)) {
      throw new Error('Reaction name is not a valid emoji');
    }
  }
}
