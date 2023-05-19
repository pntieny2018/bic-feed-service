import { Inject } from '@nestjs/common';
import {
  IMediaRepository,
  MEDIA_REPOSITORY_TOKEN,
} from '../repositoty-interface/media.repository.interface';
import { FileEntity, ImageEntity, VideoEntity } from '../model/media';
import { IMediaDomainService } from './interface/media.domain-service.interface';

export class MediaDomainService implements IMediaDomainService {
  @Inject(MEDIA_REPOSITORY_TOKEN)
  private readonly _mediaRepo: IMediaRepository;

  public async getAvailableVideos(
    videoEntities: VideoEntity[],
    videosIds: string[],
    ownerId: string
  ): Promise<VideoEntity[]> {
    if (!videosIds || videosIds?.length === 0) return [];
    let result = [];
    const currentVideoIds = (videoEntities || []).map((e) => e.get('id'));
    const addingVideoIds = videosIds.filter((id) => !currentVideoIds.includes(id));
    if (addingVideoIds.length) {
      const videos = await this._mediaRepo.findVideos(addingVideoIds);
      const availableVideos = videos.filter((video) => video.isOwner(ownerId));
      result.push(...availableVideos);
    }
    const removingVideoIds = currentVideoIds.filter((id) => !videosIds.includes(id));
    if (removingVideoIds.length) {
      result = result.filter((e) => !removingVideoIds.includes(e.get('id')));
    }
    return result;
  }

  public async getAvailableFiles(
    fileEntities: FileEntity[],
    filesIds: string[],
    ownerId: string
  ): Promise<FileEntity[]> {
    if (!filesIds || filesIds.length === 0) return [];
    let result = [];
    const currentFileIds = (fileEntities || []).map((e) => e.get('id'));
    const addingFileIds = filesIds.filter((id) => !currentFileIds.includes(id));
    if (addingFileIds.length) {
      const files = await this._mediaRepo.findFiles(addingFileIds);
      const availableFiles = files.filter((image) => image.isOwner(ownerId));
      result.push(...availableFiles);
    }

    const removingFileIds = currentFileIds.filter((id) => !filesIds.includes(id));
    if (removingFileIds.length) {
      result = result.filter((e) => !removingFileIds.includes(e.get('id')));
    }
    return result;
  }

  public async getAvailableImages(
    imageEntities: ImageEntity[],
    imagesIds: string[],
    ownerId: string
  ): Promise<ImageEntity[]> {
    if (!imagesIds || imagesIds.length === 0) return [];
    let result = [];
    const currentImageIds = (imageEntities || []).map((e) => e.get('id'));
    const addingImageIds = imagesIds.filter((id) => !currentImageIds.includes(id));
    if (addingImageIds.length) {
      const images = await this._mediaRepo.findImages(addingImageIds);
      const availableImages = images.filter((image) => image.isOwner(ownerId) && image.isReady());
      result.push(...availableImages);
    }

    const removingImageIds = currentImageIds.filter((id) => !imagesIds.includes(id));
    if (removingImageIds.length) {
      result = result.filter((e) => !removingImageIds.includes(e.get('id')));
    }
    return result;
  }
}
