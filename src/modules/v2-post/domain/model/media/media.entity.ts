import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { validate as isUUID } from 'uuid';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';
import { MediaStatus, MediaType } from '../../../data-type';

export interface MediaThumbnailProps {
  url: string;
  width: number;
  height: number;
}

export type MediaProps = {
  id: string;
  createdBy: string;
  url: string;
  type: MediaType;
  name: string;
  originName: string;
  extension: string;
  status: MediaStatus;
  mimeType: string;
  width?: number;
  height?: number;
  size?: number;
  thumbnails?: MediaThumbnailProps[];
};

export class MediaEntity extends DomainAggregateRoot<MediaProps> {
  public static MEDIA_NAME_MAX_LENGTH = 255;
  public static MEDIA_ORIGIN_NAME_MAX_LENGTH = 255;
  public static MEDIA_EXTENSION_MAX_LENGTH = 50;
  public static MEDIA_MIME_TYPE_MAX_LENGTH = 50;

  public constructor(props: MediaProps) {
    super(props);
  }

  public validate(): void {
    if (!isUUID(this._props.id)) {
      throw new DomainModelException(`Group ID must be UUID`);
    }
    if (!isUUID(this._props.createdBy)) {
      throw new DomainModelException(`Created By must be UUID`);
    }
  }
}
