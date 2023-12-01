import { FileEntity, ImageEntity, VideoEntity } from '../../model/media';

export interface IMediaDomainService {
  getAvailableImages(
    currentImageEntities: ImageEntity[],
    newImagesIds: string[],
    ownerId: string
  ): Promise<ImageEntity[]>;

  getAvailableFiles(
    currentImageEntities: FileEntity[],
    newFileIds: string[],
    ownerId: string
  ): Promise<FileEntity[]>;

  getAvailableVideos(newVideoIds: string[], ownerId: string): Promise<VideoEntity[]>;
}
export const MEDIA_DOMAIN_SERVICE_TOKEN = 'MEDIA_DOMAIN_SERVICE_TOKEN';
