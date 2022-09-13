import { HashtagController } from '../hashtag.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { HashtagService } from '../hashtag.service';
import { authUserMock } from '../../comment/tests/mocks/user.mock';
import { createHashtagDto } from './mocks/create-hashtag-dto.mock';

describe('HashtagController', () => {
  let controller: HashtagController
  let hashtagService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HashtagController],
      providers: [{
        provide: HashtagService,
        useValue: {
          create: jest.fn(),
          get: jest.fn(),
        },
      }],
    }).compile();

    controller = module.get<HashtagController>(HashtagController);
    hashtagService = module.get<HashtagService>(HashtagService);
  })

  it('should be defined', () => {
    expect(hashtagService).toBeDefined();
  });

  describe('HashtagController.get', () => {
    it('logger should be called', async () => {
      const logSpy = jest.spyOn(controller['_logger'], 'debug').mockReturnThis();
      await controller.get(authUserMock, {
        limit: 10,
      });
      expect(logSpy).toBeCalled();
    });

    it('CommentService.getComments should be called', async () => {
      hashtagService.get.mockResolvedValue([]);
      await controller.get(authUserMock, {
        limit: 10,
      });
      expect(hashtagService.get).toBeCalled();
    });
  })

  describe('HashtagController.create', () => {
    it('logger should be called', async () => {
      const logSpy = jest.spyOn(controller['_logger'], 'debug').mockReturnThis();
      await controller.create(authUserMock, createHashtagDto).catch(() => {});
      expect(logSpy).toBeCalled();
    });

    it('CommentService.create should be called', async () => {
      hashtagService.create.mockResolvedValue({});
      await controller.create(authUserMock, createHashtagDto);
      expect(hashtagService.create).toBeCalled();
    });
  })
})
