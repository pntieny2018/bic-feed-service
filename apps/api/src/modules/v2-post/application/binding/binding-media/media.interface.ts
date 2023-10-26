import { FileEntity, ImageEntity, VideoEntity } from '../../../domain/model/media';
import { ImageDto, MediaDto } from '../../dto';

export interface IMediaBinding {
  binding(data: { images?: ImageEntity[]; videos?: VideoEntity[]; files?: FileEntity[] }): MediaDto;
  imageBinding(image: ImageEntity): ImageDto;
}
export const MEDIA_BINDING_TOKEN = 'MEDIA_BINDING_TOKEN';
