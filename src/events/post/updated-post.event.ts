import { AppEvent } from '../event.constant';
import { IEventPayload } from '../../common/interfaces';
import { AudienceDto } from '../../modules/post/dto/common/audience.dto';
import { UserSharedDto } from '../../shared/user/dto';
import { PostSettingDto } from '../../modules/post/dto/common/post-setting.dto';
import { PostContentDto } from '../../modules/post/dto/common/post-content.dto';

export interface IPostPayload {
  id: number;
  isDraft: boolean;
  data: PostContentDto;
  audience: AudienceDto;
  mentions: UserSharedDto[];
  actor: UserSharedDto;
  setting: PostSettingDto;
}
export interface IUpdatedPostEventPayload {
  oldPost?: IPostPayload;
  updatedPost: IPostPayload;
}
export class UpdatedPostEvent implements IEventPayload {
  public static event = AppEvent.POST_UPDATED;

  public payload: IUpdatedPostEventPayload;
  public constructor(data: IUpdatedPostEventPayload) {
    Object.assign(this, { payload: data });
  }
}
