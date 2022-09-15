import { Test, TestingModule } from '@nestjs/testing';
import { SentryService } from '@app/sentry';
import { FollowListener } from '../follow/follow.listener';
import { PostService } from '../../modules/post/post.service';
import { FeedPublisherService } from '../../modules/feed-publisher';
import { UserService } from '../../shared/user';
import { Sequelize } from 'sequelize-typescript';
import { UsersHasBeenFollowedEvent, UsersHasBeenUnfollowedEvent } from '../../events/follow';
import { UsersHasBeenFollowedEventPayload, UsersHasBeenUnfollowedEventPayload } from '../../events/follow/payload';

describe('FollowListener', () => {

  let followListener;
  let postService;
  let feedPublisherService;
  let sentryService;
  let userService;
  let sequelize;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowListener,
        {
          provide: PostService,
          useValue: {
            findIdsByGroupId: jest.fn(),
          },
        },
        {
          provide: FeedPublisherService,
          useValue: {
            attachPostsForUsersNewsFeed: jest.fn(),
          },
        },
        {
          provide: SentryService,
          useValue: {
            captureException: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: Sequelize,
          useValue: {
            query: jest.fn(),
          },
        },
      ],
    }).compile();

    followListener = module.get<FollowListener>(FollowListener);
    postService = module.get<PostService>(PostService);
    feedPublisherService = module.get<FeedPublisherService>(FeedPublisherService);
    sentryService = module.get<SentryService>(SentryService);
    userService = module.get<UserService>(UserService);
    sequelize = module.get<Sequelize>(Sequelize);
  })

  describe('FollowListener.onUsersFollowGroups', () => {
    const usersHasBeenFollowedEvent = new UsersHasBeenFollowedEvent(
      new UsersHasBeenFollowedEventPayload(['be4c6274-31a3-4c5f-84fa-6222ca6a185d'],['a368bb27-1b92-4fdf-a885-89e30b393e9f'])
    )
    it('should success', async () => {
      const loggerSpy = jest.spyOn(followListener['_logger'], 'debug').mockReturnThis();
      postService.findIdsByGroupId.mockResolvedValue(['655a4c00-c245-4399-b64c-5ffa674a7c26']);
      feedPublisherService.attachPostsForUsersNewsFeed.mockResolvedValue()
      await followListener.onUsersFollowGroups(usersHasBeenFollowedEvent)
      expect(loggerSpy).toBeCalled()
      expect(postService.findIdsByGroupId).toBeCalled()
      expect(feedPublisherService.attachPostsForUsersNewsFeed).toBeCalled()
    })

    it('should fail', async () => {
      const loggerSpy = jest.spyOn(followListener['_logger'], 'debug').mockReturnThis();
      postService.findIdsByGroupId.mockResolvedValue([1]);
      feedPublisherService.attachPostsForUsersNewsFeed.mockRejectedValue()
      await followListener.onUsersFollowGroups(usersHasBeenFollowedEvent)
      expect(loggerSpy).toBeCalled()
      expect(postService.findIdsByGroupId).toBeCalled()
      expect(feedPublisherService.attachPostsForUsersNewsFeed).toBeCalled()
      expect(sentryService.captureException).toBeCalled()
    })
  })

  describe('FollowListener.onUsersUnFollowGroup', () => {
    const usersHasBeenUnfollowedEvent = new UsersHasBeenUnfollowedEvent(
      new UsersHasBeenUnfollowedEventPayload(['be4c6274-31a3-4c5f-84fa-6222ca6a185d'],['a368bb27-1b92-4fdf-a885-89e30b393e9f'])
    )
    it('should success', async () => {
      const loggerSpy = jest.spyOn(followListener['_logger'], 'debug').mockReturnThis();
      userService.get.mockResolvedValue({});
      sequelize.query.mockResolvedValue()
      await followListener.onUsersUnFollowGroup(usersHasBeenUnfollowedEvent)
      expect(loggerSpy).toBeCalled()
      expect(userService.get).toBeCalled()
    })
  })

})
