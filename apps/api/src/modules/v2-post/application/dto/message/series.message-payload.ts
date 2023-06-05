import { PostSettingDto } from '../post-setting.dto';
import { PostType, PostStatus } from '../../../data-type';
import { UserDto } from '../../../../v2-user/application';
import { ImageDto } from '../image.dto';

export class SeriesMessagePayload {
  public id: string;
  public actor: UserDto;
  public setting?: PostSettingDto;
  public type: PostType;
  public groupIds: string[];
  public communityIds?: string[];
  public title: string;
  public summary: string;
  public createdAt: Date;
  public updatedAt: Date;
  public lang: string;
  public isHidden: boolean;
  public status: PostStatus;
  public coverMedia?: ImageDto;
  public items?: { id: string; zindex: number }[];

  public constructor(data: Partial<SeriesMessagePayload>) {
    Object.assign(this, data);
  }
}
