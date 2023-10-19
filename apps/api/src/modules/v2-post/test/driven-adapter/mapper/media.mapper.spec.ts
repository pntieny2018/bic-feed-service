import { TestBed } from '@automock/jest';
import { File, Image, Video } from '@libs/common/dtos';

import { FileEntity, ImageEntity, VideoEntity } from '../../../domain/model/media';
import { MediaMapper } from '../../../driven-adapter/mapper/media.mapper';
import {
  createMockFile,
  createMockFileEntity,
  createMockImage,
  createMockImageEntity,
  createMockVideo,
  createMockVideoEntity,
} from '../../mock';

describe('MediaMapper', () => {
  let _mediaMapper: MediaMapper;

  let mockFile: File;
  let mockImage: Image;
  let mockVideo: Video;
  let mockFileEntity: FileEntity;
  let mockImageEntity: ImageEntity;
  let mockVideoEntity: VideoEntity;

  beforeEach(async () => {
    const { unit } = TestBed.create(MediaMapper).compile();

    _mediaMapper = unit;

    mockFile = createMockFile();
    mockImage = createMockImage();
    mockVideo = createMockVideo();
    mockFileEntity = createMockFileEntity(mockFile);
    mockImageEntity = createMockImageEntity(mockImage);
    mockVideoEntity = createMockVideoEntity(mockVideo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('toDomain', () => {
    it('Should map file to entity success', async () => {
      const fileEntity = _mediaMapper.fileToDomain(mockFile);

      expect(fileEntity).toEqual(mockFileEntity);
    });
  });

  describe('toDomain', () => {
    it('Should map image to entity success', async () => {
      const imageEntity = _mediaMapper.imageToDomain(mockImage);

      expect(imageEntity).toEqual(mockImageEntity);
    });
  });

  describe('toDomain', () => {
    it('Should map video to entity success', async () => {
      const videoEntity = _mediaMapper.videoToDomain(mockVideo);

      expect(videoEntity).toEqual(mockVideoEntity);
    });
  });
});
