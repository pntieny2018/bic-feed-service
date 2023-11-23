import { MEDIA_TYPE } from '@beincom/constants';
import { Inject } from '@nestjs/common';
import { difference, intersection } from 'lodash';

import { IKafkaAdapter, KAFKA_ADAPTER } from '../infra-adapter-interface';
import { FileEntity, ImageEntity, VideoEntity } from '../model/media';
import { IMediaAdapter, MEDIA_ADAPTER } from '../service-adapter-interface';

import { IMediaDomainService } from './interface';
import { KAFKA_TOPIC } from '@libs/infra/kafka/kafka.constant';

export class MediaDomainService implements IMediaDomainService {
  public constructor(
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter,
    @Inject(MEDIA_ADAPTER)
    private readonly _mediaAdapter: IMediaAdapter
  ) {}

  public async getAvailableVideos(videosIds: string[], ownerId: string): Promise<VideoEntity[]> {
    if (!videosIds || videosIds?.length === 0) {
      return [];
    }

    const videos = await this._mediaAdapter.findVideosByIds(videosIds);
    const result = videos.filter((video) => video.isOwner(ownerId));

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
      const files = await this._mediaAdapter.findFilesByIds(addingFileIds);
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
      const images = await this._mediaAdapter.findImagesByIds(addingImageIds);
      const availableImages = images.filter((image) => image.isOwner(ownerId) && image.isReady());
      result = result.concat(availableImages);
    }

    return result.sort((a, b) => imagesIds.indexOf(a.get('id')) - imagesIds.indexOf(b.get('id')));
  }

  public async setMediaUsed(
    mediaType: MEDIA_TYPE,
    mediaIds: string[],
    userId: string = null
  ): Promise<void> {
    const config = {
      [MEDIA_TYPE.FILE]: {
        topic: KAFKA_TOPIC.BEIN_UPLOAD.JOB.MARK_FILE_HAS_BEEN_USED,
        keyIds: 'fileIds',
      },
      [MEDIA_TYPE.VIDEO]: {
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
    mediaType: MEDIA_TYPE,
    mediaIds: string[],
    userId: string = null
  ): Promise<void> {
    const config = {
      [MEDIA_TYPE.FILE]: {
        topic: KAFKA_TOPIC.BEIN_UPLOAD.JOB.DELETE_FILES,
        keyIds: 'fileIds',
      },
      [MEDIA_TYPE.VIDEO]: {
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
