import { FileDto, ImageDto, VideoDto } from '../../../v2-post/application/dto';

export class MediaObjectDto {
  public files: FileDto[];
  public images: ImageDto[];
  public videos: VideoDto[];

  public constructor(data: MediaObjectDto) {
    Object.assign(this, data);
  }
}
