import { CONTENT_STATUS, CONTENT_TYPE } from '@beincom/constants';
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
  public before: Omit<PostMessagePayload, 'media' | 'communityIds'>;
  public after: Partial<PostMessagePayload> &
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
