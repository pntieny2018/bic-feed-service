import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';

export type PostReactionProps = {
  id: string;
  postId: string;
  reactionName: string;
  createdBy: string;
  createdAt: Date;
};
export class PostReactionEntity extends DomainAggregateRoot<PostReactionProps> {
  public constructor(props: PostReactionProps) {
    super(props);
  }

  public validate(): void {
    // Do st
  }
}
