import { PostSettingDto } from './../../modules/post/dto/common/post-setting.dto';
import { AudienceDto } from './../../modules/post/dto/common/audience.dto';
import { IEventPayload } from '../../common/interfaces';
import { AppEvent } from '../event.constant';
import { UserSharedDto } from 'src/shared/user/dto';
import { PostContentDto } from '../../modules/post/dto/common/post-content.dto';

export interface ICreatedPostPayload {
  id: number;
  isDraft: boolean;
  data: PostContentDto;
  audience: AudienceDto;
  mentions: UserSharedDto[];
  actor: UserSharedDto;
  setting: PostSettingDto;
}
export class CreatedPostEvent implements IEventPayload {
  public static event = AppEvent.POST_CREATED;
  public payload: ICreatedPostPayload;
  public constructor(data: ICreatedPostPayload) {
    Object.assign(this, { payload: data });
  }
}
