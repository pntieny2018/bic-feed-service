import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';

export type CommentReactionProps = {
  id: string;
  commentId: string;
  reactionName: string;
  createdBy: string;
  createdAt: Date;
};
export class CommentReactionEntity extends DomainAggregateRoot<CommentReactionProps> {
  public constructor(props: CommentReactionProps) {
    super(props);
  }

  public validate(): void {
    // Do st
  }
}
