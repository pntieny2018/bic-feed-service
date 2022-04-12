import { PostSettingDto } from '../../modules/post/dto/common/post-setting.dto';
import { AudienceResponseDto } from '../../modules/post/dto/responses/audience.response.dto';
import { UserSharedDto } from '../../shared/user/dto';
import { MediaFilterResponseDto } from '../../modules/media/dto/response';
import { UserMentionDto } from '../../modules/mention/dto';
export interface IPostEventPayload {
  id: number;
  isDraft: boolean;
  content: string;
  commentsCount: number;
  audience: AudienceResponseDto;
  mentions?: UserMentionDto;
  actor: UserSharedDto;
  setting: PostSettingDto;
  media?: MediaFilterResponseDto;
  createdAt: Date;
}
