import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { validate as isUUID } from 'uuid';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';

export type FileProps = {
  id: string;
  url?: string;
  name?: string;
  createdAt?: Date;
  mimeType?: string;
  size?: number;
};

export class FileEntity extends DomainAggregateRoot<FileProps> {
  public constructor(props: FileProps) {
    super(props);
  }

  public validate(): void {
    if (!isUUID(this._props.id)) {
      throw new DomainModelException(`Group ID must be UUID`);
    }
  }
}
