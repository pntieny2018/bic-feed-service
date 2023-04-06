import { DomainAggregateRoot } from '../../../common/domain-model/domain-aggregate-root';

export type GiphyProps = {
  type: string;
  id: string;
  url: string;
  height: string;
  width: string;
  size: string;
};

export class GiphyEntity extends DomainAggregateRoot<GiphyProps> {
  public constructor(props: GiphyProps) {
    super(props);
  }

  public validate(): void {
    // Not sure what to validate here
  }
}
