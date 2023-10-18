import { File, Image, Video } from '@libs/common/dtos';
import { Injectable } from '@nestjs/common';

import { FileEntity, ImageEntity, VideoEntity } from '../../domain/model/media';

@Injectable()
export class MediaMapper {
  public imageToDomain(image: Image): ImageEntity {
    return new ImageEntity(image);
  }

  public fileToDomain(file: File): FileEntity {
    return new FileEntity(file);
  }

  public videoToDomain(video: Video): VideoEntity {
    return new VideoEntity(video);
  }
}
