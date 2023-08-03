import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { validate as isUUID } from 'uuid';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';

export interface VideoThumbnailProps {
  url: string;
  width: number;
  height: number;
}

export type VideoProps = {
  id: string;
  url: string;
  name: string;
  mimeType: string;
  createdBy: string;
  size: number;
  width: number;
  height: number;
  status: string;
  thumbnails: VideoThumbnailProps[];
};

export class VideoEntity extends DomainAggregateRoot<VideoProps> {
  public constructor(props: VideoProps) {
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

  public isProcessed(): boolean {
    return this._props.status === 'DONE';
  }
}
