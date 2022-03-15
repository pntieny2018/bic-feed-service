import { PostSettingDto } from './../../modules/post/dto/common/post-setting.dto';
import { AudienceDto } from './../../modules/post/dto/common/audience.dto';
import { PostModel } from './../../database/models/post.model';
import { IEventPayload } from '../../common/interfaces';
import { AppEvent } from '../event.constant';
import { UserSharedDto } from 'src/shared/user/dto';

export interface ICreatedPostPayload {
  post: PostModel;
  audience: AudienceDto;
  mentions: UserSharedDto[];
  actor: UserSharedDto;
  setting: PostSettingDto;
}
export class CreatedPostEvent implements IEventPayload {
  public static event = AppEvent.POST_CREATED;
  public payload: ICreatedPostPayload;
  public constructor(data: ICreatedPostPayload) {
    this.payload = data;
  }
}
