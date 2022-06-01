import { Test, TestingModule } from '@nestjs/testing';
import { MediaController } from '../media.controller';
import { UploadService } from '../../upload';
import { MediaService } from '../media.service';
import { mockedUserAuth } from '../../post/test/mocks/user.mock';
import { UploadType } from '../../upload/dto/requests/upload.dto';
import { fileMock } from './mocks/file.mock';

describe('MediaController', () => {
  let controller: MediaController;
  let uploadServices;
  let mediaServices;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [
        {
          provide: UploadService,
          useValue: {
            upload: jest.fn(),
          },
        },
        {
          provide: MediaService,
          useValue: {
            create: jest.fn(),
            destroy: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MediaController>(MediaController);
    uploadServices = module.get<UploadService>(UploadService);
    mediaServices = module.get<MediaService>(MediaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('MediaController.create', () => {
    it('should _uploadService.upload and _mediaService.create called', async () => {
      uploadServices.upload.mockReturnValue('https://s3.aws.bein/asdfgh.png')
      mediaServices.create.mockReturnValue({
        toJSON: () => {
        },
      })
      await controller.create(mockedUserAuth, fileMock, UploadType.POST_IMAGE)
      expect(uploadServices.upload).toBeCalled()
      expect(mediaServices.create).toBeCalled()
    });
  })

  describe('MediaController.destroy', () => {
    it('should _mediaService.destroy called', async () => {
      mediaServices.destroy.mockReturnValue({})
      await controller.destroy(mockedUserAuth,1)
      expect(mediaServices.destroy).toBeCalled()
    });
  })
});
