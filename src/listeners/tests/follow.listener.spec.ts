import { Test, TestingModule } from '@nestjs/testing';
import { SentryService } from '@app/sentry';
import { FollowListener } from '../follow/follow.listener';
import { PostService } from '../../modules/post/post.service';
import { FeedPublisherService } from '../../modules/feed-publisher';
import { UserService } from '../../shared/user';
import { Sequelize } from 'sequelize-typescript';
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
  });
});
