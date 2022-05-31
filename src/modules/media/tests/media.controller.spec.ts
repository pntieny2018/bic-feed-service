import { Test, TestingModule } from '@nestjs/testing';
import { MediaController } from '../media.controller';
import { UploadService } from '../../upload';
import { MediaService } from '../media.service';

describe('MediaController', () => {
  let controller: MediaController;

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
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('MediaController.create', () => {
    it('should _uploadService.upload and _mediaService.create called', async () => {
    });
  })


});
