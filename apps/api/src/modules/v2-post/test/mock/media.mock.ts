import { IMAGE_RESOURCE, MEDIA_PROCESS_STATUS } from '@beincom/constants';
import { File, Image, Video } from '@libs/common/dtos';
import { v4 } from 'uuid';

import { FileEntity, ImageEntity, VideoEntity } from '../../domain/model/media';

export function createMockFile(data: Partial<File> = {}): File {
  const fileId = v4();
  return {
    id: fileId,
    url: `https://media.beincom.io/image/variants/comment/content/${fileId}`,
    name: 'test.jpg',
    createdBy: v4(),
    mimeType: 'image/jpeg',
    size: 1000,
    status: MEDIA_PROCESS_STATUS.COMPLETED,
    ...data,
  };
}

export function createMockFileEntity(data: Partial<File> = {}): FileEntity {
  const file = createMockFile(data);
  return new FileEntity(file);
}

export function createMockImage(data: Partial<Image> = {}): Image {
  const imageId = v4();
  return {
    id: imageId,
    url: `https://media.beincom.io/image/variants/comment/content/${imageId}`,
    src: `/image/variants/comment/content/${imageId}`,
    createdBy: v4(),
    mimeType: 'image/jpeg',
    resource: IMAGE_RESOURCE.COMMENT_CONTENT,
    width: 275,
    height: 183,
    status: MEDIA_PROCESS_STATUS.COMPLETED,
    ...data,
  };
}

export function createMockImageEntity(data: Partial<Image> = {}): ImageEntity {
  const image = createMockImage(data);
  return new ImageEntity(image);
}

export function createMockVideo(data: Partial<Video> = {}): Video {
  const videoId = v4();
  return {
    id: videoId,
    url: `https://media.beincom.io/image/variants/comment/content/${videoId}`,
    name: 'test.jpg',
    createdBy: v4(),
    mimeType: 'image/jpeg',
    size: 1000,
    width: 100,
    height: 100,
    duration: 100,
    status: MEDIA_PROCESS_STATUS.COMPLETED,
    thumbnails: [],
    ...data,
  };
}

export function createMockVideoEntity(data: Partial<Video> = {}): VideoEntity {
  const video = createMockVideo(data);
  return new VideoEntity(video);
}
