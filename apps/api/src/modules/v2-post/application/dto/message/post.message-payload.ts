import { CONTENT_STATUS, CONTENT_TYPE } from '@beincom/constants';
import { MEDIA_PROCESS_STATUS } from '@beincom/constants/lib/media';
import { VideoThumbnail } from '@libs/common/dtos';
import { UserDto } from '@libs/service/user';

import { FileDto, ImageDto, VideoDto } from '../media.dto';
import { PostSettingDto } from '../post.dto';
import { TagDto } from '../tag.dto';

export class PostMessagePayload {
  public id: string;
  public actor: UserDto;
  public setting: PostSettingDto;
  public type: CONTENT_TYPE;
  public groupIds: string[];
  public communityIds: string[];
  public tags: TagDto[];
  public media: {
    files: FileDto[];
    images: ImageDto[];
    videos: VideoDto[];
  };
  public seriesIds: string[];
  public content: string;
  public mentionUserIds: string[];
  public createdAt: Date;
  public updatedAt: Date;
  public publishedAt?: Date;
  public lang: string;
  public isHidden: boolean;
  public status: CONTENT_STATUS;

  public constructor(data: Partial<PostMessagePayload>) {
    Object.assign(this, data);
  }
}

export class PostChangedMessagePayload {
  public state: 'publish' | 'update' | 'delete';
  public before: Omit<PostMessagePayload, 'tags' | 'media' | 'communityIds'>;
  public after?: Partial<PostMessagePayload> &
    Partial<{
      state: {
        attachSeriesIds: string[];
        detachSeriesIds: string[];
        attachGroupIds: string[];
        detachGroupIds: string[];
        attachTagIds: string[];
        detachTagIds: string[];
        attachFileIds: string[];
        detachFileIds: string[];
        attachImageIds: string[];
        detachImageIds: string[];
        attachVideoIds: string[];
        detachVideoIds: string[];
      };
    }>;

  public constructor(data: Partial<PostChangedMessagePayload>) {
    Object.assign(this, data);
  }
}

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
