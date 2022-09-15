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
        ['8548c944-91f3-4577-99e2-18a541186c18', '8c846fe3-a615-42ae-958a-33a43d24a033', '2963a142-18a8-4420-bfaf-98680a3aee35'],
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
          ['8548c944-91f3-4577-99e2-18a541186c18', '8c846fe3-a615-42ae-958a-33a43d24a033', '2963a142-18a8-4420-bfaf-98680a3aee35'],
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
        ['8548c944-91f3-4577-99e2-18a541186c18', '8c846fe3-a615-42ae-958a-33a43d24a033', '2963a142-18a8-4420-bfaf-98680a3aee35'],
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
          ['8548c944-91f3-4577-99e2-18a541186c18', '8c846fe3-a615-42ae-958a-33a43d24a033', '2963a142-18a8-4420-bfaf-98680a3aee35'],
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
        ['8548c944-91f3-4577-99e2-18a541186c18', '8c846fe3-a615-42ae-958a-33a43d24a033', '2963a142-18a8-4420-bfaf-98680a3aee35'],
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
          ['8548c944-91f3-4577-99e2-18a541186c18', '8c846fe3-a615-42ae-958a-33a43d24a033', '2963a142-18a8-4420-bfaf-98680a3aee35'],
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
      followService.getsUnique = jest.fn().mockResolvedValue({ userIds: [2, 3, 4] });

      feedPublisherService.attachPostForAnyNewsFeed = jest
        .fn()
        .mockResolvedValue(Promise.resolve());

      sentryService.captureException = jest.fn().mockResolvedValue(Promise.resolve());

      await feedPublisherService['processFanout']('ccd73dd4-66ca-44a8-b0f6-1461a2465f83', 'a7850c03-c07d-4258-9712-c08cfd5c674d', {
        attached: ['31c2e99b-88dd-40c8-9d1a-5ad7d54572c1'],
      });

      expect(followService.getsUnique).toBeCalled();
    });

    it('Should failed', async () => {
      followService.getsUnique = jest
        .fn()
        .mockRejectedValue(new Error('Database connection error.'));

      sentryService.captureException = jest.fn().mockResolvedValue(Promise.resolve());

      try {
        await feedPublisherService['processFanout']('ccd73dd4-66ca-44a8-b0f6-1461a2465f83', 'a7850c03-c07d-4258-9712-c08cfd5c674d', {
          attached: ['f845532e-abc9-451b-95d2-e37ae3ca74d0', '31c2e99b-88dd-40c8-9d1a-5ad7d54572c1'],
        });
      } catch (e) {
        expect(e.message).toEqual('Database connection error.');
      }

      expect(sentryService.captureException).toBeCalled();
      expect(followService.getsUnique).toBeCalled();
    });
  });

  describe('Func: fanoutOnWrite', () => {
    it('Should successfully', async () => {
      feedPublisherService['processFanout'] = jest.fn().mockResolvedValue(Promise.resolve());

      feedPublisherService.fanoutOnWrite(
        'f845532e-abc9-451b-95d2-e37ae3ca74d0',
        'a7850c03-c07d-4258-9712-c08cfd5c674d',
        ['1d2daa8a-a59f-4d0f-9a3d-024848a5690e', 'b735600e-f77e-4100-84d2-e5eaa4aa3dfb', '89c5fafa-b3b6-4535-9f8a-b3dd5e4c8143'],
        ['c7bbf920-c3f1-4faf-8d56-bdbf2fa76f26']
      );

      expect(feedPublisherService['processFanout']).toBeCalled();
    });
  });
});
