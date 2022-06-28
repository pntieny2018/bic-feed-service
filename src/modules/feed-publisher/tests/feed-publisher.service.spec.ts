import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { Sequelize } from 'sequelize-typescript';
import { SentryService } from '../../../../libs/sentry/src';
import { UserNewsFeedModel } from '../../../database/models/user-newsfeed.model';
import { UserSeenPostModel } from '../../../database/models/user-seen-post.model';
import { FollowService } from '../../follow';
import { FeedPublisherService } from '../feed-publisher.service';
import { mockUserSeenPostModels } from './mocks/input.mock';

describe('FeedPublisherService', () => {
  let feedPublisherService: FeedPublisherService;
  let sentryService: SentryService;
  let userNewsfeedModel: typeof UserNewsFeedModel;
  let userSeenPostModel: typeof UserSeenPostModel;
  let sequelize: Sequelize;
  let followService: FollowService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedPublisherService,
        { provide: FollowService, useClass: jest.fn() },
        {
          provide: getModelToken(UserNewsFeedModel),
          useClass: jest.fn(),
        },
        {
          provide: getModelToken(UserSeenPostModel),
          useClass: jest.fn(),
        },
        {
          provide: SentryService,
          useClass: jest.fn(),
        },
        {
          provide: Sequelize,
          useValue: {
            transaction: jest.fn(),
            query: jest.fn(),
          },
        },
      ],
    }).compile();

    feedPublisherService = module.get<FeedPublisherService>(FeedPublisherService);
    sentryService = module.get<SentryService>(SentryService);
    userNewsfeedModel = module.get<typeof UserNewsFeedModel>(getModelToken(UserNewsFeedModel));
    userSeenPostModel = module.get<typeof UserSeenPostModel>(getModelToken(UserSeenPostModel));
    sequelize = module.get<Sequelize>(Sequelize);
    followService = module.get<FollowService>(FollowService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('Func: attachPostsForUsersNewsFeed', () => {
    it('Should successfully', async () => {
      userSeenPostModel.findAll = jest.fn().mockResolvedValue(mockUserSeenPostModels);
      sequelize.query = jest.fn().mockResolvedValue(Promise.resolve());
      sentryService.captureException = jest.fn();

      await feedPublisherService.attachPostsForUsersNewsFeed(
        [1, 2, 3],
        ['a7850c03-c07d-4258-9712-c08cfd5c674d']
      );

      expect(userSeenPostModel.findAll).toBeCalledTimes(1);
      expect(sequelize.query).toBeCalledTimes(0);
    });

    it('Should failed', async () => {
      userSeenPostModel.findAll = jest
        .fn()
        .mockRejectedValue(new Error('Database connection error.'));

      sentryService.captureException = jest.fn().mockResolvedValue(Promise.resolve());

      try {
        await feedPublisherService.attachPostsForUsersNewsFeed(
          [1, 2, 3],
          ['a7850c03-c07d-4258-9712-c08cfd5c674d']
        );
      } catch (e) {
        expect(e.message).toEqual('Database connection error.');
      }

      expect(userSeenPostModel.findAll).toBeCalledTimes(1);
      expect(sentryService.captureException).toBeCalledTimes(1);
    });
  });

  describe('Func: attachPostForAnyNewsFeed', () => {
    it('Should successfully', async () => {
      userSeenPostModel.findAll = jest.fn().mockResolvedValue(mockUserSeenPostModels);
      sequelize.query = jest.fn().mockResolvedValue(Promise.resolve());
      sentryService.captureException = jest.fn();

      await feedPublisherService.attachPostForAnyNewsFeed(
        [1, 2, 3],
        'a7850c03-c07d-4258-9712-c08cfd5c674d'
      );

      expect(userSeenPostModel.findAll).toBeCalledTimes(1);
      expect(sequelize.query).toBeCalledTimes(0);
    });

    it('Should failed', async () => {
      userSeenPostModel.findAll = jest
        .fn()
        .mockRejectedValue(new Error('Database connection error.'));

      sentryService.captureException = jest.fn().mockResolvedValue(Promise.resolve());

      try {
        await feedPublisherService.attachPostForAnyNewsFeed(
          [1, 2, 3],
          'a7850c03-c07d-4258-9712-c08cfd5c674d'
        );
      } catch (e) {
        expect(e.message).toEqual('Database connection error.');
      }

      expect(userSeenPostModel.findAll).toBeCalledTimes(1);
      expect(sentryService.captureException).toBeCalledTimes(1);
    });
  });

  describe('Func: detachPostForAnyNewsFeed', () => {
    it('Should successfully', async () => {
      userNewsfeedModel.destroy = jest.fn().mockResolvedValue(Promise.resolve());
      sentryService.captureException = jest.fn().mockResolvedValue(Promise.resolve());

      await feedPublisherService.detachPostForAnyNewsFeed(
        [1, 2, 3],
        'a7850c03-c07d-4258-9712-c08cfd5c674d'
      );

      expect(userNewsfeedModel.destroy).toBeCalledTimes(1);
      expect(sentryService.captureException).not.toBeCalled();
    });

    it('Should failed', async () => {
      userNewsfeedModel.destroy = jest
        .fn()
        .mockRejectedValue(new Error('Database connection error.'));

      sentryService.captureException = jest.fn().mockResolvedValue(Promise.resolve());

      try {
        await feedPublisherService.detachPostForAnyNewsFeed(
          [1, 2, 3],
          'a7850c03-c07d-4258-9712-c08cfd5c674d'
        );
      } catch (e) {
        expect(e.message).toEqual('Database connection error.');
      }

      expect(userNewsfeedModel.destroy).toBeCalledTimes(1);
      expect(sentryService.captureException).toBeCalled();
    });
  });

  describe('Func: processFanout', () => {
    it('Should successfully', async () => {
      followService.getUniqueUserFollows = jest.fn().mockResolvedValue({ userIds: [2, 3, 4] });

      feedPublisherService.attachPostForAnyNewsFeed = jest
        .fn()
        .mockResolvedValue(Promise.resolve());

      sentryService.captureException = jest.fn().mockResolvedValue(Promise.resolve());

      await feedPublisherService['processFanout'](1, 'a7850c03-c07d-4258-9712-c08cfd5c674d', {
        attached: [2],
      });

      expect(followService.getUniqueUserFollows).toBeCalled();
    });

    it('Should failed', async () => {
      followService.getUniqueUserFollows = jest
        .fn()
        .mockRejectedValue(new Error('Database connection error.'));

      sentryService.captureException = jest.fn().mockResolvedValue(Promise.resolve());

      try {
        await feedPublisherService['processFanout'](1, 'a7850c03-c07d-4258-9712-c08cfd5c674d', {
          attached: [1, 2],
        });
      } catch (e) {
        expect(e.message).toEqual('Database connection error.');
      }

      expect(sentryService.captureException).toBeCalled();
      expect(followService.getUniqueUserFollows).toBeCalled();
    });
  });

  describe('Func: fanoutOnWrite', () => {
    it('Should successfully', async () => {
      feedPublisherService['processFanout'] = jest.fn().mockResolvedValue(Promise.resolve());

      feedPublisherService.fanoutOnWrite(1, 'a7850c03-c07d-4258-9712-c08cfd5c674d', [2, 3, 4], [5]);

      expect(feedPublisherService['processFanout']).toBeCalled();
    });
  });
});
