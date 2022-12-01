import { MediaType } from 'express';
import { MediaStatus } from '../../../database/models/media.model';
import { PostType } from '../../../database/models/post.model';
import { GroupSharedDto } from '../../../shared/group/dto';
import { CategoryResponseDto } from '../../article/dto/responses';
import { MediaDto } from '../../media/dto';
import { MediaResponseDto } from '../../media/dto/response';
import { UserMentionDto } from '../../mention/dto';

export interface ICoverMedia {
  id: string;
  createdBy: string;
  url: string;
  createdAt: Date;
  name: string;
  originName: string;
  width?: number;
  height?: number;
  extension?: string;
}

export interface IMedia {
  id: string;
  createdBy: string;
  url: string;
  createdAt: Date;
  name: string;
  originName: string;
  status: MediaStatus;
  type?: MediaType;
  width?: number;
  height?: number;
  extension?: string;
  size?: number;
  mimeType?: string;
  thumbnails?: {
    width: number;
    height: number;
    url: string;
  }[];
}

export interface IPostElasticsearch {
  id: string;
  type: PostType;
  media: IMedia[];
  groupIds: string[];
  createdAt: string;
  createdBy: string;
  mentions: UserMentionDto;
  categories?: {
    id: string;
    name: string;
  }[];
  title?: {
    text: string;
  };
  summary?: {
    text: string;
  };
  content?: {
    lang: string;
    text: string;
  };
  coverMedia?: ICoverMedia;
  articles?: {
    id: string;
    zindex: number;
  }[];
}

export interface IPostElasticsearch {
  id: string;
  type: PostType;
  media: IMedia[];
  groupIds: string[];
  createdAt: string;
  createdBy: string;
  mentions: UserMentionDto;
  categories?: {
    id: string;
    name: string;
  }[];
  title?: {
    text: string;
  };
  summary?: {
    text: string;
  };
  content?: {
    lang: string;
    text: string;
  };
  coverMedia?: ICoverMedia;
  articles?: {
    id: string;
    zindex: number;
  }[];
}
export interface ISearchResponse {
  id: string,
  audience: {
    groups: GroupSharedDto[],
  },
  type: PostType,
  media: MediaRespon,
  content: item._source.content.text,
  title: item._source.title?.text || null,
  summary: item._source.summary?.text || null,
  mentions: item._source.mentions,
  createdAt: item._source.createdAt,
  createdBy: item._source.createdBy,
  coverMedia: item._source.coverMedia ?? null,
  categories: item._source.categories,
  articles: item._source.articles,
}

export interface IDataPostToAdd {
  id: string;
  groupIds: string[];
  createdAt: Date;
  createdBy: string;
  type: PostType;
  title?: string;
  summary?: string;
  content?: string;
  media?: IMedia[];
  mentionUserIds?: string[];
  categories?: { id: string; name: string }[];
  articles?: { id: string; zindex: number }[];
  coverMedia?: ICoverMedia;
}

export interface IDataPostToUpdate extends IDataPostToAdd {
  lang: string;
}
