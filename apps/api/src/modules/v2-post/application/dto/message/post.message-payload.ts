import { MEDIA_PROCESS_STATUS } from '@beincom/constants/lib/media';
import { VideoThumbnail } from '@libs/common/dtos';

export class PostVideoProcessedMessagePayload {
  public videoId: string;
  public status: MEDIA_PROCESS_STATUS.COMPLETED | MEDIA_PROCESS_STATUS.FAILED;
  public hlsUrl?: string;
  public thumbnails?: VideoThumbnail[];
  public properties: {
    fps?: number;
    name?: string;
    mimeType?: string;
    size?: number;
    videoCodec?: string;
    width?: number;
    height?: number;
    duration?: number;
  };

  public constructor(data: Partial<PostVideoProcessedMessagePayload>) {
    Object.assign(this, data);
  }
}
