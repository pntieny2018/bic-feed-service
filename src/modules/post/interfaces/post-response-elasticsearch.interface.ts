import { PostType } from '../../../database/models/post.model';
import { CategoryResponseDto } from '../../article/dto/responses';
import { UserDto } from '../../auth';
import { MediaDto } from '../../media/dto';
import { MediaResponseDto } from '../../media/dto/response';
import { UserMentionDto } from '../../mention/dto';
import { PostSettingDto } from '../dto/common/post-setting.dto';
import { AudienceResponseDto } from '../dto/responses';

export interface IPostElasticsearch {
  id: string;
  type: PostType;
  media: MediaDto;
  audience: AudienceResponseDto;
  categories?: CategoryResponseDto[];
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
  audience: AudienceResponseDto;
  categories?: CategoryResponseDto[];
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
