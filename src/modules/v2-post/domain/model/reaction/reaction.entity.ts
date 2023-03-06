import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';

export type ReactionProps = {
  id: string;
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
    // Do st
  }
}
