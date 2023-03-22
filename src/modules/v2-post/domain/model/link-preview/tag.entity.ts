import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';
import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { validate as isUUID } from 'uuid';

export type LinkPreviewProps = {
  id: string;
  url: string;
  domain?: string;
  image?: string;
  title?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
};

export class LinkPreviewEntity extends DomainAggregateRoot<LinkPreviewProps> {
  public constructor(props: LinkPreviewProps) {
    super(props);
  }

  public validate(): void {
    if (!isUUID(this._props.id)) {
      throw new DomainModelException(`ID must be UUID`);
    }
  }
}
