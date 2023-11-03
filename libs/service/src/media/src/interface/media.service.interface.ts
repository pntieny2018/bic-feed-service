import { File, Image, Video } from '@libs/common/dtos';

export interface IMediaService {
  findImagesByIds(ids: string[]): Promise<Image[]>;
  findFilesByIds(ids: string[]): Promise<File[]>;
  findVideosByIds(ids: string[]): Promise<Video[]>;
}

export const MEDIA_SERVICE_TOKEN = 'MEDIA_SERVICE_TOKEN';
