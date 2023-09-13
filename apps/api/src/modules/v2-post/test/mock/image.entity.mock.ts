import { ImageAttributes, ImageEntity } from '../../domain/model/media';

export const imageAttributesMock: ImageAttributes = {
  createdBy: 'e22e09b2-7956-483a-ab46-87db8a74c09d',
  height: 0,
  id: 'e22e09b2-7956-483a-ab46-87db8a74c09d',
  mimeType: '',
  resource: undefined,
  src: '',
  status: '',
  url: '',
  width: 0,
};

export const imageEntityMock = new ImageEntity(imageAttributesMock);
