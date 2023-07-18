import { MediaType } from '../../../database/models/media.model';
import { PostType } from '../../../database/models/post.model';

export interface ICoverMedia {
  id: string;
  createdBy: string;
  url: string;
  createdAt: Date;
  name: string;
  originName: string;
  type: MediaType;
  width?: number;
  height?: number;
  extension?: string;
}

export interface IPostElasticsearch {
  id: string;
  type: PostType;
  media: any;
  groupIds: string[];
  communityIds: string[];
  seriesIds?: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt: Date;
  createdBy: string;
  mentionUserIds: string[];
  categories?: {
    id: string;
    name: string;
  }[];
  tags?: {
    id: string;
    groupId: string;
    name: string;
  }[];
  title?: string;
  summary?: string;
  content?: string;
  coverMedia?: ICoverMedia;
  items?: {
    id: string;
    zindex: number;
  }[];
}

export interface IDataPostToAdd {
  id: string;
  groupIds: string[];
  communityIds: string[];
  seriesIds?: string[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date;
  createdBy: string;
  type: PostType;
  isHidden: boolean;
  title?: string;
  summary?: string;
  content?: string;
  media?: any;
  mentionUserIds?: string[];
  categories?: { id: string; name: string }[];
  items?: { id: string; zindex: number }[];
  tags?: {
    id: string;
    groupId?: string;
    name: string;
  }[];
  coverMedia?: any;
}

export interface IDataPostToUpdate extends IDataPostToAdd {
  lang: string;
}

export interface IDataPostToDelete {
  id: string;
}
