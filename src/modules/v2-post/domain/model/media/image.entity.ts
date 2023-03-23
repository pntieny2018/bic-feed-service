import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { validate as isUUID } from 'uuid';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';
import { MediaType } from '../../../data-type';

export type ImageProps = {
  id: string;
  url: string;
  name: string;
  createdAt: Date;
  mimeType?: string;
  width: number;
  height: number;
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
