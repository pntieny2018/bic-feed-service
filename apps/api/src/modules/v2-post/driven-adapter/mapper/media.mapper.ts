import { FileDto, ImageDto, MediaDto, VideoDto } from '@api/modules/v2-post/application/dto';
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

  public toDto(data: {
    images?: ImageEntity[];
    videos?: VideoEntity[];
    files?: FileEntity[];
  }): MediaDto {
    if (!data) {
      return { images: [], videos: [], files: [] };
    }

    const { images, videos, files } = data;
    return {
      images: (images || []).map((image) => new ImageDto(image.toObject())),
      videos: (videos || []).map((video) => new VideoDto(video.toObject())),
      files: (files || []).map((file) => new FileDto(file.toObject())),
    };
  }
}
