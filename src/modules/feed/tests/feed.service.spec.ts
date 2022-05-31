import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { Sequelize } from 'sequelize-typescript';
import { SentryService } from '../../../../libs/sentry/src';
import { PostModel } from '../../../database/models/post.model';
import { UserNewsFeedModel } from '../../../database/models/user-newsfeed.model';
import { UserSeenPostModel } from '../../../database/models/user-seen-post.model';
import { GroupService } from '../../../shared/group';
import { UserService } from '../../../shared/user/user.service';
import { MentionService } from '../../mention';
import { PostService } from '../../post/post.service';
import { ReactionService } from '../../reaction';
import { GetTimelineDto } from '../dto/request';
import { FeedService } from '../feed.service';
import { mockedUserAuth, mockGroup } from './mocks/input.mock';
import { mockedGetNewsFeedDto } from './mocks/request/get-newsfeed.dto.mock';
import { mockedGetTimeLineDto } from './mocks/request/get-timeline.dto.mock';

jest.mock('../../post/article.service');

class EPostModel extends PostModel {
  public reactionsCount: string;

  public commentsCount: number;

  public isNowImportant: number;
}

describe('FeedService', () => {
  let feedService: FeedService;
  let postModel, feedModel, userSeenPostModel;
  let userService: UserService;
  let groupService: GroupService;
  let mentionService: MentionService;
  let postService: PostService;
  let reactionService: ReactionService;
  let sequelize: Sequelize;
  let sentryService: SentryService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        {
          provide: UserService,
          useClass: jest.fn(),
        },
        {
          provide: GroupService,
          useClass: jest.fn(),
        },
        {
          provide: MentionService,
          useClass: jest.fn(),
        },
        {
          provide: PostService,
          useClass: jest.fn(),
        },
        {
          provide: ReactionService,
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
        {
          provide: getModelToken(UserNewsFeedModel),
          useValue: {
            destroy: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getModelToken(PostModel),
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            destroy: jest.fn(),
            findAndCountAll: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getModelToken(UserSeenPostModel),
          useValue: {
            bulkCreate: jest.fn(),
          },
        },
      ],
    }).compile();

    feedService = module.get<FeedService>(FeedService);
    userService = module.get<UserService>(UserService);
    postService = module.get<PostService>(PostService);
    groupService = module.get<GroupService>(GroupService);
    mentionService = module.get<MentionService>(MentionService);
    sequelize = module.get<Sequelize>(Sequelize);
    reactionService = module.get<ReactionService>(ReactionService);
    postModel = module.get<typeof PostModel>(getModelToken(PostModel));
    feedModel = module.get<typeof UserNewsFeedModel>(getModelToken(UserNewsFeedModel));
    userSeenPostModel = module.get<typeof UserSeenPostModel>(getModelToken(UserSeenPostModel));
    sentryService = module.get<SentryService>(SentryService);
  });

  it('should be defined', () => {
    expect(feedService).toBeDefined();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTimeline', () => {
    it('Should get successfully with predefined timeline', async () => {
      groupService.get = jest.fn().mockResolvedValue(mockGroup);
      groupService.getGroupIdsCanAccess = jest.fn().mockResolvedValue([1, 2, 3]);
      PostModel.getTotalImportantPostInGroups = jest.fn().mockResolvedValue(0);
      PostModel.getTimelineData = jest.fn().mockResolvedValue([]);
      sequelize.query = jest.fn().mockResolvedValue(Promise.resolve());
      reactionService.bindReactionToPosts = jest.fn().mockResolvedValue(Promise.resolve());
      mentionService.bindMentionsToPosts = jest.fn().mockResolvedValue(Promise.resolve());
      postService.bindActorToPost = jest.fn().mockResolvedValue(Promise.resolve());
      postService.bindAudienceToPost = jest.fn().mockResolvedValue(Promise.resolve());

      const result = await feedService.getTimeline(mockedUserAuth, mockedGetTimeLineDto);

      expect(groupService.get).toBeCalledTimes(1);
      expect(groupService.getGroupIdsCanAccess).toBeCalledTimes(1);
      expect(PostModel.getTotalImportantPostInGroups).toBeCalledTimes(1);
    });

    it('Should return BadRequestException if group found post', async () => {
      groupService.get = jest.fn().mockResolvedValue(null);
      try {
        await feedService.getTimeline(mockedUserAuth, mockedGetTimeLineDto);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
      }
    });
  });

  describe('getNewsFeed', () => {
    it('Should get newsfeed successfully', async () => {
      postService.getTotalImportantPostInNewsFeed = jest.fn().mockResolvedValue(0);
      PostModel.getNewsFeedData = jest.fn().mockResolvedValue([]);
      reactionService.bindReactionToPosts = jest.fn().mockResolvedValue(Promise.resolve());
      mentionService.bindMentionsToPosts = jest.fn().mockResolvedValue(Promise.resolve());
      postService.bindActorToPost = jest.fn().mockResolvedValue(Promise.resolve());
      postService.bindAudienceToPost = jest.fn().mockResolvedValue(Promise.resolve());

      const result = await feedService.getNewsFeed(mockedUserAuth, mockedGetNewsFeedDto);

      expect(postService.getTotalImportantPostInNewsFeed).toBeCalledTimes(1);
      expect(PostModel.getNewsFeedData).toBeCalledTimes(1);
      expect(reactionService.bindReactionToPosts).toBeCalledTimes(1);
      expect(mentionService.bindMentionsToPosts).toBeCalledTimes(1);
      expect(postService.bindActorToPost).toBeCalledTimes(1);
      expect(postService.bindAudienceToPost).toBeCalledTimes(1);
    });

    it('Should failed', async () => {
      postService.getTotalImportantPostInNewsFeed = jest.fn().mockResolvedValue(0);
      PostModel.getNewsFeedData = jest
        .fn()
        .mockRejectedValue(new Error('Database connection error.'));
      reactionService.bindReactionToPosts = jest.fn().mockResolvedValue(Promise.resolve());
      mentionService.bindMentionsToPosts = jest.fn().mockResolvedValue(Promise.resolve());
      postService.bindActorToPost = jest.fn().mockResolvedValue(Promise.resolve());
      postService.bindAudienceToPost = jest.fn().mockResolvedValue(Promise.resolve());
      sentryService.captureException = jest.fn().mockResolvedValue(Promise.resolve());

      try {
        const result = await feedService.getNewsFeed(mockedUserAuth, mockedGetNewsFeedDto);
      } catch (e) {
        expect(e.message).toEqual('Database connection error.');
      }
      expect(sentryService.captureException).toBeCalled();
    });
  });

  describe('markSeenPosts', () => {
    it('Should successfully', async () => {
      userSeenPostModel.bulkCreate = jest.fn().mockResolvedValue(Promise.resolve());
      feedModel.update = jest.fn().mockResolvedValue(Promise.resolve());

      await feedService.markSeenPosts(
        [
          '8548c944-91f3-4577-99e2-18a541186c18',
          '8548c944-91f3-4577-99e2-18a541186c19',
          '8548c944-91f3-4577-99e2-18a541186e18',
        ],
        5
      );

      expect(userSeenPostModel.bulkCreate).toBeCalledTimes(1);
      expect(feedModel.update).toBeCalledTimes(1);
    });

    it('Should failed', async () => {
      userSeenPostModel.bulkCreate = jest
        .fn()
        .mockRejectedValue(new Error('Database connection error.'));

      sentryService.captureException = jest.fn().mockResolvedValue(Promise.resolve());

      try {
        await feedService.markSeenPosts(['8548c944-91f3-4577-99e2-18a541186c18'], 5);
      } catch (e) {
        expect(e.message).toEqual('Database connection error.');
      }

      expect(userSeenPostModel.bulkCreate).toBeCalledTimes(1);
      expect(sentryService.captureException).toBeCalledTimes(1);
    });
  });

  describe('deleteNewsFeedByPost', () => {
    it('Should successfully', async () => {
      feedModel.destroy = jest.fn().mockResolvedValue(Promise.resolve());

      await feedService.deleteNewsFeedByPost('6fe93729-3088-4e82-9bfa-03a5e4a9a6e6', null);

      expect(feedModel.destroy).toBeCalledTimes(1);
    });
  });

  describe('_getIdConstrains', () => {
    it('Should successfully', async () => {
      sequelize.escape = jest.fn();

      const getTimeLineDto = {
        idGT: 'c8efbda1-4333-430c-871a-07481c640b60',
        idGTE: '57adfbdd-7993-49c1-8c21-136d9b2e3dc9',
        idLT: '80f01461-af26-4fa9-97e8-787bf94f0013',
        idLTE: '097f9763-12be-4e02-bf8e-8ddd7f8375ee',
      };

      feedService['_getIdConstrains'](getTimeLineDto as any as GetTimelineDto);

      expect(sequelize.escape).toBeCalledTimes(6);
    });
  });
});
