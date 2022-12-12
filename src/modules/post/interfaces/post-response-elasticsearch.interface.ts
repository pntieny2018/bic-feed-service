import { PostType } from '../../../database/models/post.model';
import { CategoryResponseDto } from '../../article/dto/responses';
import { MediaDto } from '../../media/dto';
import { MediaResponseDto } from '../../media/dto/response';
import { UserMentionDto } from '../../mention/dto';

export interface IPostElasticsearch {
  id: string;
  type: PostType;
  media: MediaDto;
  groupIds: string[];
  createdAt: string;
  createdBy: string;
  mentions: UserMentionDto;
  categories?: CategoryResponseDto[];
  title?: string;
  summary?: string;
  content?: string;
  coverMedia?: MediaResponseDto;
  articles?: {
    id: string;
    zindex: number;
  }[];
}
