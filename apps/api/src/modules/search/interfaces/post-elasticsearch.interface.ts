import { CONTENT_TYPE, IMAGE_RESOURCE, MEDIA_PROCESS_STATUS, MEDIA_TYPE } from '@beincom/constants';

export interface ICoverMedia {
  id: string;
  createdBy: string;
  url: string;
  source: string;
  resource: IMAGE_RESOURCE;
  mimeType: string;
  status: MEDIA_PROCESS_STATUS;
  createdAt: Date;
  name: string;
  originName: string;
  type: MEDIA_TYPE;
  width?: number;
  height?: number;
  extension?: string;
}

export interface IPostElasticsearch {
  id: string;
  type: CONTENT_TYPE;
  media: any;
  groupIds: string[];
  communityIds: string[];
  seriesIds?: string[];
  createdAt: Date;
  updatedAt: Date;
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
  itemIds?: string[];
  highlight?: Record<string, string[]>;
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
  type: CONTENT_TYPE;
  isHidden: boolean;
  title?: string;
  summary?: string;
  content?: string;
  media?: any;
  mentionUserIds?: string[];
  categories?: { id: string; name: string }[];
  itemIds?: string[];
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
