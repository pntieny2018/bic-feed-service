import { Inject } from '@nestjs/common';
import {
  IMediaRepository,
  MEDIA_REPOSITORY_TOKEN,
} from '../repositoty-interface/media.repository.interface';
import { FileEntity, ImageEntity, VideoEntity } from '../model/media';
import { IMediaDomainService } from './interface/media.domain-service.interface';
import { difference, intersection } from 'lodash';

export class MediaDomainService implements IMediaDomainService {
  @Inject(MEDIA_REPOSITORY_TOKEN)
  private readonly _mediaRepo: IMediaRepository;

  public async getAvailableVideos(
    videoEntities: VideoEntity[],
    videosIds: string[],
    ownerId: string
  ): Promise<VideoEntity[]> {
    if (!videosIds || videosIds?.length === 0) return [];

    videoEntities = videoEntities || [];
    const currentVideoIds = videoEntities.map((e) => e.get('id'));
    const notChangedIds = intersection(currentVideoIds, videosIds);
    const addingVideoIds = difference(videosIds, currentVideoIds);
    let result = videoEntities.filter((e) => notChangedIds.includes(e.get('id')));

    if (addingVideoIds.length) {
      const videos = await this._mediaRepo.findVideos(addingVideoIds);
      const availableVideos = videos.filter((video) => video.isOwner(ownerId));
      result = result.concat(availableVideos);
    }

    return result.sort((a, b) => videosIds.indexOf(a.get('id')) - videosIds.indexOf(b.get('id')));
  }

  public async getAvailableFiles(
    fileEntities: FileEntity[],
    filesIds: string[],
    ownerId: string
  ): Promise<FileEntity[]> {
    if (!filesIds || filesIds.length === 0) return [];

    fileEntities = fileEntities || [];
    const currentFileIds = fileEntities.map((e) => e.get('id'));
    const notChangedIds = intersection(currentFileIds, filesIds);
    const addingFileIds = difference(filesIds, currentFileIds);
    let result = fileEntities.filter((e) => notChangedIds.includes(e.get('id')));

    if (addingFileIds.length) {
      const files = await this._mediaRepo.findFiles(addingFileIds);
      const availableFiles = files.filter((file) => file.isOwner(ownerId));
      result = result.concat(availableFiles);
    }

    return result.sort((a, b) => filesIds.indexOf(a.get('id')) - filesIds.indexOf(b.get('id')));
  }

  public async getAvailableImages(
    imageEntities: ImageEntity[],
    imagesIds: string[],
    ownerId: string
  ): Promise<ImageEntity[]> {
    if (!imagesIds || imagesIds.length === 0) return [];

    imageEntities = imageEntities || [];
    const currentImageIds = imageEntities.map((e) => e.get('id'));
    const notChangedIds = intersection(currentImageIds, imagesIds);
    const addingImageIds = difference(imagesIds, currentImageIds);
    let result = imageEntities.filter((e) => notChangedIds.includes(e.get('id')));

    if (addingImageIds.length) {
      const images = await this._mediaRepo.findImages(addingImageIds);
      const availableImages = images.filter((image) => image.isOwner(ownerId) && image.isReady());
      result = result.concat(availableImages);
    }

    return result.sort((a, b) => imagesIds.indexOf(a.get('id')) - imagesIds.indexOf(b.get('id')));
  }

  public async getImage(imageId: string, ownerId: string): Promise<ImageEntity> {
    if (!imageId) return;
    const images = await this._mediaRepo.findImages([imageId]);
    if (images.length === 0) return;
    if (!images[0].isOwner(ownerId) || !images[0].isReady()) return;
    return images[0];
  }
}
