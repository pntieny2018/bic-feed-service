import { MediaStatus, MediaType } from '../../../database/models/media.model';
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

export interface IMedia {
  id: string;
  createdBy: string;
  url: string;
  createdAt: Date;
  name: string;
  originName: string;
  status?: MediaStatus;
  type: MediaType;
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
  communityIds: string[];
  createdAt: string;
  updatedAt: string;
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
  createdAt: Date;
  updatedAt: Date;
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
    groupId: string;
    name: string;
  }[];
  coverMedia?: ICoverMedia;
}

export interface IDataPostToUpdate extends IDataPostToAdd {
  lang: string;
}
