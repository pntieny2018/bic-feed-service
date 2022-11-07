import { PostType } from '../../../database/models/post.model';
import { UserDto } from '../../auth';
import { MediaDto } from '../../media/dto';
import { MediaResponseDto } from '../../media/dto/response';
import { UserMentionDto } from '../../mention/dto';
import { PostSettingDto } from '../dto/common/post-setting.dto';
import { AudienceRequestDto } from '../dto/requests/audience.request.dto';

export interface IPostElasticsearch {
  id: string;
  type: PostType;
  media: MediaDto;
  audience: AudienceRequestDto;
  title?: {
    text: string;
  };
  summary?: {
    text: string;
  };
  content: {
    lang: string;
    text: string;
  };
  setting: PostSettingDto;
  actor: UserDto;
  createdAt: string;
  totalUsersSeen: number;
  commentsCount: number;
  mentions: UserMentionDto;
  coverMedia?: MediaResponseDto;
}

export interface IPostResponseElasticsearch {
  id: string;
  type: PostType;
  media: MediaDto;
  audience: AudienceRequestDto;
  title?: string;
  titleHighlight?: string;
  summary?: string;
  summaryHighlight?: string;
  content: string;
  highlight?: string;
  setting: PostSettingDto;
  actor: UserDto;
  createdAt: string;
  totalUsersSeen: number;
  commentsCount: number;
  mentions: UserMentionDto;
  coverMedia?: MediaResponseDto;
}
