import { MediaType } from '../../../data-type';
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

  getAvailableVideos(
    currentImageEntities: VideoEntity[],
    newVideoIds: string[],
    ownerId: string
  ): Promise<VideoEntity[]>;

  setMediaUsed(mediaType: MediaType, mediaIds: string[], userId: string): Promise<void>;
  setMediaDelete(mediaType: MediaType, mediaIds: string[], userId: string): Promise<void>;
}
export const MEDIA_DOMAIN_SERVICE_TOKEN = 'MEDIA_DOMAIN_SERVICE_TOKEN';
