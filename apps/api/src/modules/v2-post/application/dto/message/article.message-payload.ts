import { CONTENT_STATUS, CONTENT_TYPE } from '@beincom/constants';

import { UserDto } from '../../../../v2-user/application';
import { PostStatus, PostType } from '../../../data-type';
import { FileDto, ImageDto, VideoDto } from '../media.dto';
import { PostSettingDto } from '../post.dto';
import { TagDto } from '../tag.dto';

export class ArticleMessagePayload {
  public id: string;
  public actor: UserDto;
  public setting: PostSettingDto;
  public type: PostType | CONTENT_TYPE;
  public groupIds: string[];
  public communityIds?: string[];
  public media?: {
    files: FileDto[];
    images: ImageDto[];
    videos: VideoDto[];
  };
  public categories?: {
    id: string;
    name: string;
  }[];
  public coverMedia?: ImageDto;
  public tags: TagDto[];
  public seriesIds: string[];
  public seriesActors?: string[];
  public content: string;
  public title: string;
  public summary: string;
  public lang: string;
  public isHidden: boolean;
  public status: PostStatus | CONTENT_STATUS;
  public createdAt: Date;
  public updatedAt: Date;
  public publishedAt: Date;

  public constructor(data: Partial<ArticleMessagePayload>) {
    Object.assign(this, data);
  }
}

export class ArticleChangedMessagePayload {
  public state: 'publish' | 'update' | 'delete';
  public before?: ArticleMessagePayload;
  public after?: ArticleMessagePayload & {
    state?: {
      attachGroupIds: string[];
      detachGroupIds: string[];
      attachTagIds?: string[];
      detachTagIds?: string[];
      attachSeriesIds?: string[];
      detachSeriesIds?: string[];
    };
  };

  public constructor(data: Partial<ArticleChangedMessagePayload>) {
    Object.assign(this, data);
  }
}
