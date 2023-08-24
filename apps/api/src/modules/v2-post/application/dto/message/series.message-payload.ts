import { CONTENT_STATUS, CONTENT_TYPE } from '@beincom/constants';

import { UserDto } from '../../../../v2-user/application';
import { PostType, PostStatus } from '../../../data-type';
import { ImageDto } from '../media.dto';
import { PostSettingDto } from '../post.dto';

export class SeriesMessagePayload {
  public id: string;
  public actor: UserDto;
  public setting?: PostSettingDto;
  public type: PostType | CONTENT_TYPE;
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
  public status: PostStatus | CONTENT_STATUS;
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
