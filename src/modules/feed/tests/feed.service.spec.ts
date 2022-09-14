import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { Sequelize } from 'sequelize-typescript';
import { SentryService } from '@app/sentry';
import { PostModel } from '../../../database/models/post.model';
import { UserNewsFeedModel } from '../../../database/models/user-newsfeed.model';
import { UserSeenPostModel } from '../../../database/models/user-seen-post.model';
import { GroupService } from '../../../shared/group';
import { UserService } from '../../../shared/user';
import { MentionService } from '../../mention';
import { PostService } from '../../post/post.service';
import { ReactionService } from '../../reaction';
import { FeedService } from '../feed.service';
import { mockedUserAuth, mockGroup } from './mocks/input.mock';
import { mockedGetNewsFeedDto } from './mocks/request/get-newsfeed.dto.mock';
import { mockedGetTimeLineDto } from './mocks/request/get-timeline.dto.mock';
import { mockIPost } from '../../post/test/mocks/input.mock';
import { mockUserSeenPostModels } from '../../feed-publisher/tests/mocks/input.mock';
import { HTTP_STATUS_ID } from '../../../common/constants';
import { createMock } from '@golevelup/ts-jest';
import { GroupPrivacy } from '../../../shared/group/dto';
import { PostBindingService } from '../../post/post-binding.service';

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
  let postBindingService: PostBindingService;

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
          useValue: createMock<GroupService>(),
        },
        {
          provide: PostBindingService,
          useValue: createMock<PostBindingService>(),
        },
        {
          provide: MentionService,
          useClass: jest.fn(),
        },
        {
          provide: PostService,
          useValue: {
            groupPosts: jest.fn(),
          },
        },
        {
          provide: ReactionService,
          useClass: jest.fn(),
        },
        {
          provide: SentryService,
          useValue: {
            captureException: jest.fn(),
          },
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
    postBindingService = module.get<PostBindingService>(PostBindingService);
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
      groupService.getGroupIdsCanAccess = jest
        .fn()
        .mockResolvedValue([
          '73b8af34-af5e-4de9-9c6d-31c49db9c7a8',
          '1c63365d-a7ba-4b02-ba01-8a5f515f941d',
          '42d8ea55-8f73-44b4-9f7d-3434e1dd0de0',
        ]);
      PostModel.getTotalImportantPostInGroups = jest.fn().mockResolvedValue(0);
      PostModel.getTimelineData = jest.fn().mockResolvedValue([]);
      sequelize.query = jest.fn().mockResolvedValue(Promise.resolve());
      postService.groupPosts = jest.fn().mockReturnValue([]);
      reactionService.bindToPosts = jest.fn().mockResolvedValue(Promise.resolve());
      mentionService.bindMentionsToPosts = jest.fn().mockResolvedValue(Promise.resolve());
      postBindingService.bindActorToPost = jest.fn().mockResolvedValue(Promise.resolve());
      postBindingService.bindAudienceToPost = jest.fn().mockResolvedValue(Promise.resolve());

      await feedService.getTimeline(mockedUserAuth, mockedGetTimeLineDto);

      expect(groupService.get).toBeCalledTimes(1);
      expect(groupService.getGroupIdsCanAccess).toBeCalledTimes(1);
      expect(PostModel.getTotalImportantPostInGroups).toBeCalledTimes(1);
    });

    it('Should get successfully with predefined timeline and null user', async () => {
      groupService.get = jest.fn().mockResolvedValue(mockGroup);
      groupService.getGroupIdsCanAccess = jest
        .fn()
        .mockResolvedValue([
          '73b8af34-af5e-4de9-9c6d-31c49db9c7a8',
          '1c63365d-a7ba-4b02-ba01-8a5f515f941d',
          '42d8ea55-8f73-44b4-9f7d-3434e1dd0de0',
        ]);
      PostModel.getTotalImportantPostInGroups = jest.fn().mockResolvedValue(0);
      PostModel.getTimelineData = jest.fn().mockResolvedValue([]);
      sequelize.query = jest.fn().mockResolvedValue(Promise.resolve());
      postService.groupPosts = jest.fn().mockReturnValue([]);
      reactionService.bindToPosts = jest.fn().mockResolvedValue(Promise.resolve());
      mentionService.bindMentionsToPosts = jest.fn().mockResolvedValue(Promise.resolve());
      postBindingService.bindActorToPost = jest.fn().mockResolvedValue(Promise.resolve());
      postBindingService.bindAudienceToPost = jest.fn().mockResolvedValue(Promise.resolve());

      await feedService.getTimeline(null, mockedGetTimeLineDto);

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
      PostModel.getTotalImportantPostInNewsFeed = jest.fn().mockResolvedValue(0);
      PostModel.getNewsFeedData = jest.fn().mockResolvedValue([]);
      reactionService.bindToPosts = jest.fn().mockResolvedValue(Promise.resolve());
      mentionService.bindMentionsToPosts = jest.fn().mockResolvedValue(Promise.resolve());
      postBindingService.bindActorToPost = jest.fn().mockResolvedValue(Promise.resolve());
      postBindingService.bindAudienceToPost = jest.fn().mockResolvedValue(Promise.resolve());

      await feedService.getNewsFeed(mockedUserAuth, mockedGetNewsFeedDto);

      // expect(PostModel.getTotalImportantPostInNewsFeed).toBeCalledTimes(1);
      // expect(PostModel.getNewsFeedData).toBeCalledTimes(1);
    });

    it('Should failed', async () => {
      PostModel.getTotalImportantPostInNewsFeed = jest.fn().mockResolvedValue(0);
      PostModel.getNewsFeedData = jest
        .fn()
        .mockRejectedValue(new Error('Database connection error.'));
      reactionService.bindToPosts = jest.fn().mockResolvedValue(Promise.resolve());
      mentionService.bindMentionsToPosts = jest.fn().mockResolvedValue(Promise.resolve());
      postBindingService.bindActorToPost = jest.fn().mockResolvedValue(Promise.resolve());
      postBindingService.bindAudienceToPost = jest.fn().mockResolvedValue(Promise.resolve());
      sentryService.captureException = jest.fn().mockResolvedValue(Promise.resolve());

      try {
        await feedService.getNewsFeed(mockedUserAuth, mockedGetNewsFeedDto);
      } catch (e) {
        expect(e.message).toEqual('Database connection error.');
      }
      // expect(sentryService.captureException).toBeCalled();
    });
  });

  describe('markSeenPosts', () => {
    it('Should successfully', async () => {
      userSeenPostModel.findOne = jest.fn().mockResolvedValue(null);
      userSeenPostModel.create = jest.fn().mockResolvedValue(Promise.resolve());
      feedModel.update = jest.fn().mockResolvedValue(Promise.resolve());

      await feedService.markSeenPosts(
        '8548c944-91f3-4577-99e2-18a541186c18',
        '6d075299-77fd-4b8f-8f2d-e317cd5f60ff'
      );

      expect(userSeenPostModel.create).toBeCalledTimes(1);
      expect(feedModel.update).toBeCalledTimes(1);
    });

    it('Should failed', async () => {
      userSeenPostModel.create = jest
        .fn()
        .mockRejectedValue(new Error('Database connection error.'));

      sentryService.captureException = jest.fn().mockResolvedValue(Promise.resolve());

      try {
        await feedService.markSeenPosts(
          '8548c944-91f3-4577-99e2-18a541186c18',
          '6d075299-77fd-4b8f-8f2d-e317cd5f60ff'
        );
      } catch (e) {
        expect(e.message).toEqual('Database connection error.');
      }

      expect(userSeenPostModel.create).toBeCalledTimes(1);
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

  describe('FeedServices.getUsersSeenPots', () => {
    it('should success', async () => {
      postService.findPost = jest.fn().mockResolvedValue(mockIPost);
      userSeenPostModel.findAll = jest.fn().mockResolvedValue(mockUserSeenPostModels);
      groupService.isMemberOfSomeGroups = jest.fn().mockReturnValue(true);
      userSeenPostModel.count = jest.fn().mockResolvedValue(1);
      userService.getMany = jest.fn().mockResolvedValue({
        id: 1,
        fullname: 'Bret Josh',
        username: 'bret.josh',
        avatar: 'https://bein.group/josh.png',
      });
      const userInfo = await feedService.getUsersSeenPots(mockedUserAuth, {
        limit: 25,
        offset: 0,
        postId: '8548c944-91f3-4577-99e2-18a541186c18',
      });

      expect(postService.findPost).toBeCalled();
      expect(userSeenPostModel.findAll).toBeCalled();
      expect(groupService.isMemberOfSomeGroups).toBeCalled();
      expect(userSeenPostModel.count).toBeCalled();
      expect(userService.getMany).toBeCalled();
      expect(userInfo).toEqual({
        list: {
          avatar: 'https://bein.group/josh.png',
          fullname: 'Bret Josh',
          id: 1,
          username: 'bret.josh',
        },
        meta: {
          hasNextPage: false,
          hasPreviousPage: false,
          limit: 25,
          total: 1,
        },
      });
    });
    it('should fail if member not in group', async () => {
      postService.findPost = jest.fn().mockResolvedValue(mockIPost);
      groupService.isMemberOfSomeGroups = jest.fn().mockReturnValue(false);
      sentryService.captureException = jest.fn();
      try {
        await feedService.getUsersSeenPots(mockedUserAuth, {
          limit: 25,
          offset: 0,
          postId: '8548c944-91f3-4577-99e2-18a541186c18',
        });
      } catch (e) {
        expect(postService.findPost).toBeCalled();
        expect(groupService.isMemberOfSomeGroups).toBeCalled();
        expect(sentryService.captureException).toBeCalled();
        expect(e.message).toEqual(HTTP_STATUS_ID.API_FORBIDDEN);
      }
    });
  });
});
