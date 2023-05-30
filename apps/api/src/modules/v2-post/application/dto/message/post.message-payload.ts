import { GroupDto } from '../../../../v2-group/application';
import { PostSettingDto } from '../post-setting.dto';
import { PostType } from '../../../data-type';
import { UserMentionDto } from '../user-mention.dto';
import { TagDto } from '../tag.dto';
import { UserDto } from '../../../../v2-user/application';
import { FileDto } from '../file.dto';
import { ImageDto } from '../image.dto';
import { VideoDto } from '../video.dto';
import { PostStatus } from '../../../data-type/post-status.enum';

export class PostMessagePayload {
  public id: string;
  public actor: UserDto;
  public setting: PostSettingDto;
  public type: PostType;
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
  public lang: string;
  public isHidden: boolean;
  public status: PostStatus;

  public constructor(data: Partial<PostMessagePayload>) {
    Object.assign(this, data);
  }
}
