import { IFile, IImage, IVideo } from '@app/database/postgres/model/comment.model';

export interface IMediaService {
  findImagesByIds(ids: string[]): Promise<IImage[]>;
  findFilesByIds(ids: string[]): Promise<IFile[]>;
  findVideosByIds(ids: string[]): Promise<IVideo[]>;
}
