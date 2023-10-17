import { File } from '@libs/common/dtos';
import { validate as isUUID } from 'uuid';

import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';

export type FileAttributes = File;

export class FileEntity extends DomainAggregateRoot<FileAttributes> {
  public constructor(props: FileAttributes) {
    super(props);
  }

  public validate(): void {
    if (!isUUID(this._props.id)) {
      throw new DomainModelException(`Group ID must be UUID`);
    }
  }

  public isOwner(userId: string): boolean {
    return this._props.createdBy === userId;
  }
}
