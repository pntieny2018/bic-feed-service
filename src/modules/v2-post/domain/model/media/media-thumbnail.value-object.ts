import { ValueObject, ValueObjectProperties } from '@beincom/domain';
import { MediaHeight } from './media-height.value-object';
import { MediaUrl } from './media-url.value-object';
import { MediaWidth } from './media-width.value-object';

export interface MediaThumbnailProps {
  url: MediaUrl;
  width: MediaWidth;
  height: MediaHeight;
}
export class MediaThumbnail extends ValueObject<MediaThumbnailProps> {
  public constructor(props: ValueObjectProperties<MediaThumbnailProps>) {
    super(props);
  }

  public static fromJson(value: MediaThumbnailProps): MediaThumbnail {
    return new MediaThumbnail(value);
  }

  public validate(): void {
    //none
  }
}
