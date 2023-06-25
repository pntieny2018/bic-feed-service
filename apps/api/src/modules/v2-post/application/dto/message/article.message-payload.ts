import { PostSettingDto } from '../post-setting.dto';
import { PostType } from '../../../data-type';
import { TagDto } from '../tag.dto';
import { UserDto } from '../../../../v2-user/application';
import { FileDto } from '../file.dto';
import { ImageDto } from '../image.dto';
import { VideoDto } from '../video.dto';
import { PostStatus } from '../../../data-type/post-status.enum';

export class ArticleMessagePayload {
  public id: string;
  public actor: UserDto;
  public setting: PostSettingDto;
  public type: PostType;
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
  public series?: {
    id: string;
    createdBy: string;
  }[];
  public content: string;
  public title: string;
  public summary: string;
  public lang: string;
  public isHidden: boolean;
  public status: PostStatus;
  public createdAt: Date;
  public updatedAt: Date;
  public publishedAt: Date;

  public constructor(data: Partial<ArticleMessagePayload>) {
    Object.assign(this, data);
  }
}
