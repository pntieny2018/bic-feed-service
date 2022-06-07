import { UploadType } from '../../../upload/dto/requests/upload.dto';
import { MediaStatus } from '../../../../database/models/media.model';

export const createMediaDtoMock = {
  url: 'https://s3.aws.bein/asdfgh.png',
  uploadType: UploadType.POST_IMAGE,
  name: 'asdfgh.png',
  originName: 'asdfgh',
  extension: 'png',
  width: 500,
  height: 500,
  status: MediaStatus.COMPLETED,
};
