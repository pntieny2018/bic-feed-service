import { MEDIA_PROCESS_STATUS } from '@beincom/constants/lib/media';
import { Video } from '@libs/common/dtos';
import { validate as isUUID } from 'uuid';

import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { DomainModelException } from '../../../../../common/exceptions';

export type VideoAttributes = Video;

export class VideoEntity extends DomainAggregateRoot<VideoAttributes> {
  public constructor(props: VideoAttributes) {
    super(props);
  }

  public validate(): void {
    if (!isUUID(this._props.id)) {
      throw new DomainModelException(`Video ID must be UUID`);
    }
  }

  public isOwner(userId: string): boolean {
    return this._props.createdBy === userId;
  }

  public isProcessed(): boolean {
    return this._props.status === MEDIA_PROCESS_STATUS.COMPLETED;
  }
}
