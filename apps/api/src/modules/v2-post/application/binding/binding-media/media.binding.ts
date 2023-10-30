import { FileEntity, ImageEntity, VideoEntity } from '../../../domain/model/media';
import { FileDto, ImageDto, MediaDto, VideoDto } from '../../dto';

import { IMediaBinding } from './media.interface';

export class MediaBinding implements IMediaBinding {
  public constructor() {
    //
  }

  public binding(data: {
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

  public imageBinding(image: ImageEntity): ImageDto {
    return image ? new ImageDto(image.toObject()) : null;
  }
}
