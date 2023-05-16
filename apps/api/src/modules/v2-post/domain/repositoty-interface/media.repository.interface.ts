import { FileEntity, ImageEntity, VideoEntity } from '../model/media';

export interface IMediaRepository {
  findImages(ids: string[]): Promise<ImageEntity[]>;
  findFiles(ids: string[]): Promise<FileEntity[]>;
  findVideos(ids: string[]): Promise<VideoEntity[]>;
}

export const MEDIA_REPOSITORY_TOKEN = 'MEDIA_REPOSITORY_TOKEN';
