import { AggregateRoot, CreatedAt, EntityProps, IDomainEvent, UpdatedAt } from '@beincom/domain';
import { MediaId, MediaName } from '.';
import { UserId } from '../../../../v2-user/domain/model/user';
import {
  MediaExtension,
  MediaHeight,
  MediaMimeType,
  MediaOriginName,
  MediaSize,
  MediaStatus,
  MediaThumbnail,
  MediaType,
  MediaUrl,
  MediaWidth,
} from '.';

export type MediaProps = {
  createdBy: UserId;
  url: MediaUrl;
  type: MediaType;
  name: MediaName;
  originName: MediaOriginName;
  extension: MediaExtension;
  status: MediaStatus;
  mimeType: MediaMimeType;
  width?: MediaWidth;
  height?: MediaHeight;
  size?: MediaSize;
  thumbnails?: MediaThumbnail[];
};

export class MediaEntity extends AggregateRoot<MediaId, MediaProps> {
  public static MEDIA_NAME_MAX_LENGTH = 255;
  public static MEDIA_ORIGIN_NAME_MAX_LENGTH = 255;
  public static MEDIA_EXTENSION_MAX_LENGTH = 50;
  public static MEDIA_MIME_TYPE_MAX_LENGTH = 50;

  protected _id: MediaId;

  public constructor(
    entityProps: EntityProps<MediaId, MediaProps>,
    domainEvent: IDomainEvent<unknown>[] = []
  ) {
    super(entityProps, domainEvent, { disablePropSetter: false });
    this._id = entityProps.id;
  }

  public validate(): void {
    //
  }

  public static fromJson(raw: any): MediaEntity {
    const props: EntityProps<MediaId, MediaProps> = {
      id: MediaId.fromString(raw.id),
      props: {
        createdBy: UserId.fromString(raw.createdBy),
        url: MediaUrl.fromString(raw.url),
        type: MediaType.fromString(raw.type),
        name: MediaName.fromString(raw.name),
        originName: MediaOriginName.fromString(raw.originName),
        extension: MediaExtension.fromString(raw.extension),
        status: MediaStatus.fromString(raw.status),
        mimeType: MediaMimeType.fromString(raw.mimeType),
        width: MediaWidth.fromString(raw.width || 0),
        height: MediaHeight.fromString(raw.height || 0),
        size: MediaSize.fromString(raw.size || 0),
        thumbnails: (raw.thumbnails || []).map((thumbnail) =>
          MediaThumbnail.fromJson({
            url: thumbnail.url,
            width: thumbnail.width,
            height: thumbnail.height,
          })
        ),
      },
      createdAt: CreatedAt.fromDateString(raw.createdAt),
      updatedAt: UpdatedAt.fromDateString(raw.updatedAt),
    };

    return new MediaEntity(props);
  }
}
