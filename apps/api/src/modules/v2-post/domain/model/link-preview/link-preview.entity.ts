import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';
import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { validate as isUUID } from 'uuid';

export type LinkPreviewProps = {
  url: string;
  domain: string;
  image: string;
  title: string;
  description: string;
};

export type LinkPreviewAttributes = {
  id: string;
  url: string;
  domain?: string;
  image?: string;
  title?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
};

export class LinkPreviewEntity extends DomainAggregateRoot<LinkPreviewAttributes> {
  public constructor(props: LinkPreviewAttributes) {
    super(props);
  }

  public validate(): void {
    if (!isUUID(this._props.id)) {
      throw new DomainModelException(`ID must be UUID`);
    }
  }

  public update(data: LinkPreviewProps): void {
    this._props = {
      ...this._props,
      ...data,
      updatedAt: new Date(),
    };
  }
}
