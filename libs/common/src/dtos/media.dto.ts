import { IMAGE_RESOURCE, MEDIA_PROCESS_STATUS } from '@beincom/constants';

export type Media = {
  files: File[];
  images: Image[];
  videos: Video[];
};

export type File = {
  id: string;
  url: string;
  name: string;
  createdBy: string;
  mimeType: string;
  size: number;
  status: MEDIA_PROCESS_STATUS;
};

export type Image = {
  id: string;
  url: string;
  src?: string;
  createdBy: string;
  mimeType: string;
  resource: IMAGE_RESOURCE;
  width: number;
  height: number;
  status: MEDIA_PROCESS_STATUS;
};

export type Video = {
  id: string;
  url: string;
  hlsUrl: string;
  name: string;
  mimeType: string;
  createdBy: string;
  size: number;
  width: number;
  height: number;
  duration: number;
  status: MEDIA_PROCESS_STATUS;
  thumbnails: VideoThumbnail[];
};

export type VideoThumbnail = {
  url: string;
  width: number;
  height: number;
};
