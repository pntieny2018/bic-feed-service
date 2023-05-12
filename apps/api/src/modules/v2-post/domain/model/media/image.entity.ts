import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { validate as isUUID } from 'uuid';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';

export type ImageProps = {
  id: string;
  url?: string;
  source?: string;
  createdBy?: string;
  mimeType?: string;
  resource?: string;
  width?: number;
  height?: number;
  status?: string;
};

export class ImageEntity extends DomainAggregateRoot<ImageProps> {
  public constructor(props: ImageProps) {
    super(props);
  }

  public validate(): void {
    if (!isUUID(this._props.id)) {
      throw new DomainModelException(`Group ID must be UUID`);
    }
  }
}
