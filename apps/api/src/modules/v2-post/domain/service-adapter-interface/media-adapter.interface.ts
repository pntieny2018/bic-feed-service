import { FileEntity, ImageEntity, VideoEntity } from '../model/media';

export interface IMediaAdapter {
  findImagesByIds(ids: string[]): Promise<ImageEntity[]>;
  findFilesByIds(ids: string[]): Promise<FileEntity[]>;
  findVideosByIds(ids: string[]): Promise<VideoEntity[]>;
}

export const MEDIA_ADAPTER = 'MEDIA_ADAPTER';
