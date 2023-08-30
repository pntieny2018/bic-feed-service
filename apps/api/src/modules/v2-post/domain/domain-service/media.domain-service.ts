import { Inject } from '@nestjs/common';
import { difference, intersection } from 'lodash';

import { KAFKA_TOPIC } from '../../../../common/constants';
import { MediaType } from '../../data-type';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../infra-adapter-interface';
import { FileEntity, ImageEntity, VideoEntity } from '../model/media';
import { IMediaRepository, MEDIA_REPOSITORY_TOKEN } from '../repositoty-interface';

import { IMediaDomainService } from './interface/media.domain-service.interface';

export class MediaDomainService implements IMediaDomainService {
  @Inject(MEDIA_REPOSITORY_TOKEN)
  private readonly _mediaRepo: IMediaRepository;
  @Inject(KAFKA_ADAPTER)
  private readonly _kafkaAdapter: IKafkaAdapter;

  public async getAvailableVideos(
    videoEntities: VideoEntity[],
    videosIds: string[],
    ownerId: string
  ): Promise<VideoEntity[]> {
    if (!videosIds || videosIds?.length === 0) {
      return [];
    }

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
    if (!filesIds || filesIds.length === 0) {
      return [];
    }

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
    if (!imagesIds || imagesIds.length === 0) {
      return [];
    }

    imageEntities = (imageEntities || []).filter((image) => image);
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

  public async setMediaUsed(
    mediaType: MediaType,
    mediaIds: string[],
    userId: string = null
  ): Promise<void> {
    const config = {
      [MediaType.FILE]: {
        topic: KAFKA_TOPIC.BEIN_UPLOAD.JOB.MARK_FILE_HAS_BEEN_USED,
        keyIds: 'fileIds',
      },
      [MediaType.VIDEO]: {
        topic: KAFKA_TOPIC.BEIN_UPLOAD.JOB.MARK_VIDEO_HAS_BEEN_USED,
        keyIds: 'videoIds',
      },
    };

    if (!config[mediaType]) {
      return;
    }
    if (mediaIds.length) {
      await this._kafkaAdapter.emit(config[mediaType].topic, {
        key: null,
        value: { [config[mediaType].keyIds]: mediaIds, userId },
      });
    }
  }

  public async setMediaDelete(
    mediaType: MediaType,
    mediaIds: string[],
    userId: string = null
  ): Promise<void> {
    const config = {
      [MediaType.FILE]: {
        topic: KAFKA_TOPIC.BEIN_UPLOAD.JOB.DELETE_FILES,
        keyIds: 'fileIds',
      },
      [MediaType.VIDEO]: {
        topic: KAFKA_TOPIC.BEIN_UPLOAD.JOB.DELETE_VIDEOS,
        keyIds: 'videoIds',
      },
    };

    if (!config[mediaType]) {
      return;
    }
    if (mediaIds.length) {
      await this._kafkaAdapter.emit(config[mediaType].topic, {
        key: null,
        value: { [config[mediaType].keyIds]: mediaIds, userId },
      });
    }
  }
}
