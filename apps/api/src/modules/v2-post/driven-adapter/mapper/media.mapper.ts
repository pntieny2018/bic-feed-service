import { IFile, IImage, IVideo } from '@libs/database/postgres/model/comment.model';
import { Injectable } from '@nestjs/common';

import { FileEntity, ImageEntity, VideoEntity } from '../../domain/model/media';

@Injectable()
export class MediaMapper {
  public imageToDomain(image: IImage): ImageEntity {
    return new ImageEntity({
      id: image.id,
      url: image.url,
      src: image.src,
      createdBy: image.createdBy,
      mimeType: image.mimeType,
      resource: image.resource,
      width: image.width,
      height: image.height,
      status: image.status,
    });
  }

  public fileToDomain(file: IFile): FileEntity {
    return new FileEntity({
      createdBy: file.createdBy,
      id: file.id,
      mimeType: file.mimeType,
      name: file.name,
      size: file.size,
      url: file.url,
    });
  }

  public videoToDomain(video: IVideo): VideoEntity {
    return new VideoEntity({
      createdBy: video.createdBy,
      height: video.height,
      id: video.id,
      mimeType: video.mimeType,
      name: video.name,
      size: video.size,
      status: video.status,
      thumbnails: video.thumbnails,
      url: video.url,
      width: video.width,
    });
  }
}
