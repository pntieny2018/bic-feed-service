import { PostSettingDto } from './../../modules/post/dto/common/post-setting.dto';
import { AudienceDto } from './../../modules/post/dto/common/audience.dto';
import { UserSharedDto } from 'src/shared/user/dto';
import { PostContentDto } from '../../modules/post/dto/common/post-content.dto';
export interface IPostEventPayload {
  id: number;
  isDraft: boolean;
  data: PostContentDto;
  audience: AudienceDto;
  mentions: UserSharedDto[];
  actor: UserSharedDto;
  setting: PostSettingDto;
}
