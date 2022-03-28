import { PostSettingDto } from './../../modules/post/dto/common/post-setting.dto';
import { AudienceDto } from './../../modules/post/dto/common/audience.dto';
import { UserSharedDto } from '../../shared/user/dto';
import { MediaFilterResponseDto } from '../../modules/media/dto/response';
export interface IPostEventPayload {
  id: number;
  isDraft: boolean;
  content: string;
  commentsCount: number;
  audience: AudienceDto;
  mentions: UserSharedDto[];
  actor: UserSharedDto;
  setting: PostSettingDto;
  media?: MediaFilterResponseDto;
}
