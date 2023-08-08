import { PostType, PostStatus } from '../../../data-type';
import { UserDto } from '../../../../v2-user/application';
import { PostSettingDto } from '../post.dto';
import { ImageDto } from '../media.dto';

export class SeriesMessagePayload {
  public id: string;
  public actor: UserDto;
  public setting?: PostSettingDto;
  public type: PostType;
  public groupIds: string[];
  public communityIds?: string[];
  public itemIds?: string[];
  public title: string;
  public summary: string;
  public createdAt: Date;
  public updatedAt: Date;
  public publishedAt?: Date;
  public lang: string;
  public isHidden: boolean;
  public status: PostStatus;
  public coverMedia?: ImageDto;

  public constructor(data: Partial<SeriesMessagePayload>) {
    Object.assign(this, data);
  }
}

export class SeriesChangedMessagePayload {
  public state: 'publish' | 'update' | 'delete';
  public before?: SeriesMessagePayload;
  public after?: SeriesMessagePayload & {
    state: {
      attachGroupIds: string[];
      detachGroupIds: string[];
    };
  };

  public constructor(data: Partial<SeriesChangedMessagePayload>) {
    Object.assign(this, data);
  }
}
