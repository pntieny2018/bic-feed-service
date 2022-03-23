import { Test, TestingModule } from '@nestjs/testing';
import { FeedService } from '../feed.service';
import { PostModel } from '../../../database/models/post.model';
import { mockGetTimeLineDto, mockUserDto } from './mocks/input.mock';
import { mockGetTimelineOutput } from './mocks/output.mock';
import { FeedController } from '../feed.controller';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('FeedController', () => {
  let feedController: FeedController;
  let feedService: FeedService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedController],
      providers: [
        {
          provide: FeedService,
          useValue: {
            getTimeline: jest.fn(),
          },
        },
      ],
    }).compile();

    feedController = module.get<FeedController>(FeedController);
    feedService = module.get<FeedService>(FeedService);
  });

  it('should be defined', () => {
    expect(feedController).toBeDefined();
    expect(feedService).toBeDefined();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('User get timeline', () => {
    it('Should get successfully with predefined timeline', async () => {
      const feedServiceGetTimeLineSpy = jest
        .spyOn(feedService, 'getTimeline')
        .mockResolvedValue(mockGetTimelineOutput);
      const result = await feedController.getTimeline(mockUserDto, mockGetTimeLineDto);
      expect(result).toEqual(mockGetTimelineOutput);
      expect(feedServiceGetTimeLineSpy).toBeCalledTimes(1);
    });
  });
});
