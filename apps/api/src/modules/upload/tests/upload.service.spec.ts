import { UploadService } from '../upload.service';

describe('UploadService', () => {
  let service: UploadService;
  const configMock = {
    region: 'string',
    bucket: 'string',
    publicBucket: 'string',
    entityAttributeBucket: 'string',
    userSharingAssetsBucket: 'string',
    ACL: 'string',
  };

  beforeEach(async () => {
    service = new UploadService({
      get: (arg: any) => configMock,
    } as any);

    service['_s3Config'] = configMock;

    service['_storage'] = {
      send: jest.fn().mockResolvedValue({}),
    } as any;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('UploadService.upload', function () {
    it('should return url', async () => {
      const keyMock = 'image/c973f6db-33c8-4f90-a46c-c8335d81beac.png';
      jest.spyOn(service, 'getKey').mockReturnValue(keyMock);

      const url = await service.upload(
        {
          fieldname: 'hello',
          originalname: 'hello.png',
          encoding: 'utf8',
          mimetype: 'images/png',
          size: 1024,
          stream: null,
          destination: '/',
          filename: 'hello',
          path: '/',
          buffer: Buffer.from('xxxx'),
        },
        'images'
      );

      expect(url).toEqual(
        `https://${configMock.bucket}.s3.${configMock.region}.amazonaws.com/${keyMock}`
      );
    });
  });
  describe('UploadService.getKey', function () {
    it('should return key hava uiid v4', function () {
      const key = service.getKey('post_image', {
        extension: 'png',
      });
      expect(key).not.toBeNull();
    });

    it('should throw exception', function () {
      try {
        service.getKey('image', {
          extension: 'png',
        });
      } catch (e) {
        expect(e.message).toEqual('generate s3 path failed');
      }
    });
  });
});
