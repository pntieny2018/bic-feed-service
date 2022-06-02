import { Test, TestingModule } from '@nestjs/testing';
import { FeedPublisherService } from '../feed-publisher.service';
import { FollowService } from '../../follow';
import { getModelToken } from '@nestjs/sequelize';
import { UserNewsFeedModel } from '../../../database/models/user-newsfeed.model';
import { UserSeenPostModel } from '../../../database/models/user-seen-post.model';
import { SentryService } from '@app/sentry';

describe('FeedPublisherService', () => {
  let service: FeedPublisherService;
  let userNewsFeedModel;
  let userSeenPostModel;
  let sentry;
  let followService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedPublisherService,
        {
          provide: FollowService,
          useValue: {
            getUniqueUserFollows: jest.fn(),
          },
        },
        {
          provide: getModelToken(UserNewsFeedModel),
          useValue: {
            findAll: jest.fn(),
            destroy: jest.fn(),
            count: jest.fn(),
            sequelize: {
              query: jest.fn(),
            }
          },
        },
        {
          provide: getModelToken(UserSeenPostModel),
          useValue: {
            findAll: jest.fn(),
            destroy: jest.fn(),
            count: jest.fn(),
            sequelize: {
              query: jest.fn(),
            }
          },
        },
        {
          provide: SentryService,
          useValue: {
            captureException: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FeedPublisherService>(FeedPublisherService);
    userNewsFeedModel = module.get<typeof UserNewsFeedModel>(getModelToken(UserNewsFeedModel))
    userSeenPostModel = module.get<typeof UserSeenPostModel>(getModelToken(UserSeenPostModel))
    sentry = module.get<SentryService>(SentryService)
    followService = module.get<FollowService>(FollowService)
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('FeedPublisherService.attachPostsForUsersNewsFeed', () => {
    it('should success', async () => {
      const logSpy = jest.spyOn(service['_logger'], 'debug').mockReturnThis();
      userSeenPostModel.findAll.mockResolvedValue(Promise.resolve([{postId: '1', userId: 1}]))
      userNewsFeedModel.sequelize.query.mockResolvedValue(Promise.resolve())
      await service.attachPostsForUsersNewsFeed([1,2], ['1','2'])
      expect(logSpy).toBeCalled()
      expect(userSeenPostModel.findAll).toBeCalled()
      expect(userNewsFeedModel.sequelize.query).toBeCalled()
    })

    it('should log fail', async () => {
      const logSpy = jest.spyOn(service['_logger'], 'debug').mockReturnThis();
      const errorMessage = 'Whatever'
      userSeenPostModel.findAll.mockRejectedValue(new Error(errorMessage))
      try {
        await service.attachPostsForUsersNewsFeed([1,2], ['1','2'])
        expect(logSpy).toBeCalled()

      } catch (e) {
        expect(e.message).toEqual(errorMessage)
        expect(logSpy).toBeCalled()
        expect(sentry.captureException).toBeCalled()
      }
    })
  })

  describe('FeedPublisherService.attachPostForAnyNewsFeed', () => {
    it('should success', async () => {
      const logSpy = jest.spyOn(service['_logger'], 'debug').mockReturnThis();
      userSeenPostModel.findAll.mockResolvedValue(Promise.resolve([{postId: '1', userId: 1}]))
      userNewsFeedModel.sequelize.query.mockResolvedValue(Promise.resolve())
      await service.attachPostForAnyNewsFeed([1,2], '1')
      expect(logSpy).toBeCalled()
      expect(userSeenPostModel.findAll).toBeCalled()
      expect(userNewsFeedModel.sequelize.query).toBeCalled()
    })

    it('should log fail', async () => {
      const logSpy = jest.spyOn(service['_logger'], 'debug').mockReturnThis();
      const errorMessage = 'Whatever'
      userSeenPostModel.findAll.mockRejectedValue(new Error(errorMessage))
      try {
        await service.attachPostForAnyNewsFeed([1,2], '1')
        expect(logSpy).toBeCalled()

      } catch (e) {
        expect(e.message).toEqual(errorMessage)
        expect(logSpy).toBeCalled()
        expect(sentry.captureException).toBeCalled()
      }
    })
  })

  describe('FeedPublisherService.detachPostForAnyNewsFeed', () => {
    it('should success', async () => {
      const logSpy = jest.spyOn(service['_logger'], 'debug').mockReturnThis();
      userNewsFeedModel.destroy.mockResolvedValue(Promise.resolve())
      await service.detachPostForAnyNewsFeed([1,2], '1')
      expect(logSpy).toBeCalled()
      expect(userNewsFeedModel.destroy).toBeCalled()
    })

    it('should log fail', async () => {
      const logSpy = jest.spyOn(service['_logger'], 'debug').mockReturnThis();
      const errorMessage = 'Whatever'
      userNewsFeedModel.destroy.mockRejectedValue(new Error(errorMessage))
      try {
        await service.detachPostForAnyNewsFeed([1,2], '1')
        expect(logSpy).toBeCalled()

      } catch (e) {
        expect(e.message).toEqual(errorMessage)
        expect(logSpy).toBeCalled()
        expect(sentry.captureException).toBeCalled()
      }
    })
  })

  describe('FeedPublisherService.fanoutOnWrite', () => {
    it('should return all', async () => {
      const logSpy = jest.spyOn(service['_logger'], 'debug').mockReturnThis();
      followService.getUniqueUserFollows.mockResolvedValue(Promise.resolve({userIds: [1], latestFollowId: 1}))
      try {
        await service.fanoutOnWrite(1, '1', [1, 2], [2, 3])

      } catch (e) {
        expect(logSpy).toBeCalled()
        expect(followService.getUniqueUserFollows).toBeCalled()
        expect(sentry.captureException).toBeCalled()
      }

    })
  })
});
