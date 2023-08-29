import { IFile, IImage, IVideo } from '@libs/database/postgres/model/comment.model';

export interface IMediaService {
  findImagesByIds(ids: string[]): Promise<IImage[]>;
  findFilesByIds(ids: string[]): Promise<IFile[]>;
  findVideosByIds(ids: string[]): Promise<IVideo[]>;
}

export const MEDIA_SERVICE_TOKEN = 'MEDIA_SERVICE_TOKEN';

export const MEDIA_SERVICE_TOKEN = 'MEDIA_SERVICE_TOKEN';
