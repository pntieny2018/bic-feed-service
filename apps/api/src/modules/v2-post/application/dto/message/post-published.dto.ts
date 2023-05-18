import { GroupDto } from '../../../../v2-group/application';
import { PostSettingDto } from '../post-setting.dto';
import { PostType } from '../../../data-type';
import { UserMentionDto } from '../user-mention.dto';
import { MediaDto } from '../../../../media/dto';
import { TagDto } from '../tag.dto';
import { UserDto } from '../../../../v2-user/application';

export class PostPublishedMessageDto {
  public id: string;
  public actor: UserDto;
  public setting: PostSettingDto;
  public type: PostType;
  public audience: {
    groups: GroupDto[];
  };
  public communities: GroupDto[];
  public tags: TagDto[];
  public media: MediaDto;
  public seriesIds: string[];
  public content: string;
  public mentions: UserMentionDto;
  public createdAt: Date;
  public updatedAt: Date;

  public constructor(data: Partial<PostPublishedMessageDto>) {
    Object.assign(this, data);
  }
}
