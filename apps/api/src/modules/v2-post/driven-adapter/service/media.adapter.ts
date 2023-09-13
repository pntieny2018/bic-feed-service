import { IMediaService, MEDIA_SERVICE_TOKEN } from '@libs/service/media/src/interface';
import { Inject, Injectable } from '@nestjs/common';

import { FileEntity, ImageEntity, VideoEntity } from '../../domain/model/media';
import { IMediaAdapter } from '../../domain/service-adapter-interface';
import { MediaMapper } from '../mapper/media.mapper';

@Injectable()
export class MediaAdapter implements IMediaAdapter {
  public constructor(
    @Inject(MEDIA_SERVICE_TOKEN)
    private readonly _mediaService: IMediaService,
    private readonly _mediaMapper: MediaMapper
  ) {}

  public async findFilesByIds(ids: string[]): Promise<FileEntity[]> {
    return (await this._mediaService.findFilesByIds(ids)).map((i) =>
      this._mediaMapper.fileToDomain(i)
    );
  }

  public async findImagesByIds(ids: string[]): Promise<ImageEntity[]> {
    return (await this._mediaService.findImagesByIds(ids)).map((i) =>
      this._mediaMapper.imageToDomain(i)
    );
  }

  public async findVideosByIds(ids: string[]): Promise<VideoEntity[]> {
    return (await this._mediaService.findVideosByIds(ids)).map((i) =>
      this._mediaMapper.videoToDomain(i)
    );
  }
}
