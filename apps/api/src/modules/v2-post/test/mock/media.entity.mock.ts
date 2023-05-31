import { ImageResource } from '../../data-type';
import { ImageEntity } from '../../domain/model/media';

export const imageEntites = [
  new ImageEntity({
    id: '95809c73-e73e-4c49-855a-67ff0ca58346',
    url: 'https://media.beincom.io/image/variants/comment/content/95809c73-e73e-4c49-855a-67ff0ca58346',
    src: '/image/variants/comment/content/95809c73-e73e-4c49-855a-67ff0ca58346',
    createdBy: '6235bc91-2255-4f4b-bcfa-bebcd24e27ac',
    mimeType: 'image/jpeg',
    resource: ImageResource.COMMENT_CONTENT,
    width: 275,
    height: 183,
    status: 'DONE',
  }),
];

export const invalidImageComment = [
  new ImageEntity({
    id: '95809c73-e73e-4c49-855a-67ff0ca58346',
    url: 'https://media.beincom.io/image/variants/comment/content/95809c73-e73e-4c49-855a-67ff0ca58346',
    src: '/image/variants/comment/content/95809c73-e73e-4c49-855a-67ff0ca58346',
    createdBy: '6235bc91-2255-4f4b-bcfa-bebcd24e27ac',
    mimeType: 'image/jpeg',
    resource: ImageResource.POST_CONTENT,
    width: 275,
    height: 183,
    status: 'DONE',
  }),
];
