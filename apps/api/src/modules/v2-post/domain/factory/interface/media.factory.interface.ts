import { FileDto } from '../../../application/dto/file.dto';
import { ImageDto } from '../../../application/dto/image.dto';
import { VideoDto } from '../../../application/dto/video.dto';
import {
  FileEntity,
  FileProps,
  ImageEntity,
  ImageProps,
  VideoEntity,
  VideoProps,
} from '../../model/media';

export interface IMediaFactory {
  createFile(props: FileDto): FileEntity;
  createImage(props: ImageDto): ImageEntity;
  createVideo(props: VideoDto): VideoEntity;

  reconstituteFile(props: FileProps): FileEntity;
  reconstituteImage(props: ImageProps): ImageEntity;
  reconstituteVideo(props: VideoProps): VideoEntity;
}
export const MEDIA_FACTORY_TOKEN = 'MEDIA_FACTORY_TOKEN';
