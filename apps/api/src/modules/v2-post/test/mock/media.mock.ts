import { IMAGE_RESOURCE, MEDIA_PROCESS_STATUS } from '@beincom/constants';
import { IFile, IImage, IVideo } from '@libs/database/postgres/model/comment.model';
import { v4 } from 'uuid';

import { FileEntity, ImageEntity, VideoEntity } from '../../domain/model/media';

export function createMockFileEntity(data: Partial<IFile> = {}): FileEntity {
  const fileId = v4();
  const userId = v4();

  return new FileEntity({
    id: fileId,
    url: `https://media.beincom.io/image/variants/comment/content/${fileId}`,
    name: 'test.jpg',
    createdBy: userId,
    mimeType: 'image/jpeg',
    size: 1000,
    ...data,
  });
}

export function createMockImageEntity(data: Partial<IImage> = {}): ImageEntity {
  const imageId = v4();
  const userId = v4();

  return new ImageEntity({
    id: imageId,
    url: `https://media.beincom.io/image/variants/comment/content/${imageId}`,
    src: `/image/variants/comment/content/${imageId}`,
    createdBy: userId,
    mimeType: 'image/jpeg',
    resource: IMAGE_RESOURCE.COMMENT_CONTENT,
    width: 275,
    height: 183,
    status: MEDIA_PROCESS_STATUS.COMPLETED,
    ...data,
  });
}

export function createMockVideoEntity(data: Partial<IVideo> = {}): VideoEntity {
  const videoId = v4();
  const userId = v4();

  return new VideoEntity({
    id: videoId,
    url: `https://media.beincom.io/image/variants/comment/content/${videoId}`,
    name: 'test.jpg',
    createdBy: userId,
    mimeType: 'image/jpeg',
    size: 1000,
    width: 100,
    height: 100,
    status: MEDIA_PROCESS_STATUS.COMPLETED,
    thumbnails: [],
    ...data,
  });
}
