import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';

export type ReactionProps = {
  reactionName: string;
};
export class ReactionEntity extends DomainAggregateRoot<ReactionProps> {
  public constructor(props: ReactionProps) {
    super(props);
  }

  public validate(): void {
    // Do st
  }
}
