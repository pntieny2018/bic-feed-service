import { validate as isUUID, v4 } from 'uuid';

import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';

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

  public static create(options: Partial<LinkPreviewAttributes>): LinkPreviewEntity {
    const { title, description, domain, url, image } = options;
    const now = new Date();
    return new LinkPreviewEntity({
      id: v4(),
      title,
      description,
      domain,
      image,
      url,
      createdAt: now,
      updatedAt: now,
    });
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
