import { Test, TestingModule } from '@nestjs/testing';
import { FeedService } from '../feed.service';
import { FeedController } from '../feed.controller';
import { GetTimelineDto } from '../dto/request';
import { mockedUserAuth } from './mocks/input.mock';

import { GetNewsFeedDto } from '../dto/request/get-newsfeed.dto';

jest.mock('../feed.service');
describe('FeedController', () => {
  let feedController: FeedController;
  let feedService: FeedService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedController],
      providers: [
        {
          provide: FeedService,
          useClass: jest.fn(),
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
        groupId: 'c233a814-1fe9-437d-9b7b-1babee5ccad5',
      };
      feedService.getTimeline = jest.fn().mockResolvedValue(Promise.resolve());
      const result = await feedController.getTimeline(mockedUserAuth, getTimelineDto);
      expect(feedService.getTimeline).toBeCalledTimes(1);
      expect(feedService.getTimeline).toBeCalledWith(mockedUserAuth, getTimelineDto);
    });

    it('Should get timeline successfully even null user', async () => {
      const getTimelineDto: GetTimelineDto = {
        groupId: 'c233a814-1fe9-437d-9b7b-1babee5ccad5',
      };
      feedService.getTimeline = jest.fn().mockResolvedValue(Promise.resolve());
      const result = await feedController.getTimeline(null, getTimelineDto);
      expect(feedService.getTimeline).toBeCalledTimes(1);
      expect(feedService.getTimeline).toBeCalledWith(null, getTimelineDto);
    });
  });

  describe('getNewsFeed', () => {
    it('Should get getNewsFeed successfully', async () => {
      const getNewsFeedDto: GetNewsFeedDto = {};
      feedService.getNewsFeed = jest.fn().mockResolvedValue(Promise.resolve());
      const result = await feedController.getNewsFeed(mockedUserAuth, getNewsFeedDto);
      expect(feedService.getNewsFeed).toBeCalledTimes(1);
      expect(feedService.getNewsFeed).toBeCalledWith(mockedUserAuth, getNewsFeedDto);
    });
  });

  describe('markSeenPost', () => {
    it('Should successfully', async () => {
      feedService.markSeenPosts = jest.fn().mockResolvedValue(Promise.resolve());
      await feedController.markSeenPost(mockedUserAuth, 'f433e351-d04a-4bdf-9680-b8e27925e87f');
      expect(feedService.markSeenPosts).toBeCalledTimes(1);
    });
  });
});
