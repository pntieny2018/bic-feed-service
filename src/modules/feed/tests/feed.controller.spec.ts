import { Test, TestingModule } from '@nestjs/testing';
import { FeedService } from '../feed.service';
import { PostModel } from '../../../database/models/post.model';
import { FeedController } from '../feed.controller';
import { HttpException, HttpStatus } from '@nestjs/common';
import { GetTimelineDto } from '../dto/request';
import { mockedUserAuth } from './mocks/data/user-auth.data.mock';
import { GetNewsFeedDto } from '../dto/request/get-newsfeed.dto';

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
            getNewsFeed: jest.fn()
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

  describe('getTimeline', () => {
    it('Should get timeline successfully', async () => {
      const getTimelineDto: GetTimelineDto = {
        groupId: 1
      }
      const result = await feedController.getTimeline(mockedUserAuth, getTimelineDto);      
      expect(feedService.getTimeline).toBeCalledTimes(1);
      expect(feedService.getTimeline).toBeCalledWith(mockedUserAuth.id, getTimelineDto);
    });
  });

  describe('getNewsFeed', () => {
    it('Should get getNewsFeed successfully', async () => {
      const getNewsFeedDto: GetNewsFeedDto = {}
      const result = await feedController.getNewsFeed(mockedUserAuth, getNewsFeedDto);      
      expect(feedService.getNewsFeed).toBeCalledTimes(1);
      expect(feedService.getNewsFeed).toBeCalledWith(mockedUserAuth.id, getNewsFeedDto);
    });
  });
});
