import { getModelToken, SequelizeModule } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { FeedService } from '../feed.service';
import { PostModel } from '../../../database/models/post.model';
import { UserService } from '../../../shared/user/user.service';
import { createMock } from '@golevelup/ts-jest';
import { GroupService } from '../../../shared/group';
import { MentionService } from '../../mention';
import { PostService } from '../../post/post.service';
import { BadRequestException } from '@nestjs/common';
import { mockedTimelineAll } from './mocks/data/timeline.data.mock';
import { mockedGroups } from './mocks/data/groups.data.mock';
import { mockedUserAuth } from './mocks/data/user-auth.data.mock';
import { mockedGetTimeLineDto } from './mocks/request/get-timeline.dto.mock';
import { mockedTimelineResponse, mockTimelineResponse } from './mocks/response/timeline.response.mock';
import { mockedNewsFeed } from './mocks/data/newsfeed.data.mock';
import { mockedNewsFeedResponse } from './mocks/response/newsfeed.response.mock';
import { mockedGetNewsFeedDto } from './mocks/request/get-newsfeed.dto.mock';
import { UserNewsFeedModel } from '../../../database/models/user-newsfeed.model';
import { Sequelize } from 'sequelize-typescript';
import { ReactionService } from '../../reaction';
import { UserSeenPostModel } from '../../../database/models/user-seen-post.model';
import { GroupPrivacy, GroupSharedDto } from '../../../shared/group/dto';
import { GetTimelineDto } from '../dto/request';

class EPostModel extends PostModel {
  public reactionsCount: string;

  public commentsCount: number;

  public isNowImportant: number;
}

describe('FeedService', () => {
  let feedService: FeedService;
  let postModelMock, feedModelMock, userSeenPostModelMock;
  let userService: UserService;
  let groupService: GroupService;
  let mentionService: MentionService;
  let postService: PostService;
  let reactionService: ReactionService;
  let sequelize: Sequelize;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        {
          provide: UserService,
          useValue: {
            getMany: jest.fn(),
          },
        },
        {
          provide: GroupService,
          useValue: {
            get: jest.fn(),
            getGroupIdsCanAccess: jest.fn()
          }
        },
        {
          provide: MentionService,
          useValue: {
            bindMentionsToPosts: jest.fn()
          }
        },
        {
          provide: PostService,
          useValue: {
            bindActorToPost: jest.fn(),
            bindAudienceToPost: jest.fn(),
            getTotalImportantPostInGroups: jest.fn(),
            getTotalImportantPostInNewsFeed: jest.fn()
          }
        },
        {
          provide: ReactionService,
          useValue: {
            bindReactionToPosts: jest.fn()
          }
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
    postModelMock = module.get<typeof PostModel>(getModelToken(PostModel));
    feedModelMock = module.get<typeof UserNewsFeedModel>(getModelToken(UserNewsFeedModel));
    userSeenPostModelMock = module.get<typeof UserSeenPostModel>(getModelToken(UserSeenPostModel));
  });

  it('should be defined', () => {
    expect(feedService).toBeDefined();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTimeline', () => {
    it('Should get successfully with predefined timeline', async () => {
      mockTimelineResponse;
      const mockGroup: GroupSharedDto = {
        id: 1,
        name: 'group 1',
        icon: 'icon 1',
        privacy: GroupPrivacy.PUBLIC,
        child: {
          public: [2, 3],
          open: [],
          private: [],
          secret: []
        }
      };
      const mockedGetTimeLineDto: GetTimelineDto = {
        groupId: 2,
        offset: 0,
        limit: 5,
      };

      jest.spyOn(groupService, 'get').mockResolvedValue(mockGroup);
      jest.spyOn(groupService, 'getGroupIdsCanAccess').mockReturnValue([1,2,3]);
      jest.spyOn(PostModel, 'getTotalImportantPostInGroups').mockResolvedValue(0);
      jest.spyOn(PostModel, 'getTimelineData').mockResolvedValue([]);
      
      const result = await feedService.getTimeline(mockedUserAuth, mockedGetTimeLineDto);
      
      expect(groupService.get).toBeCalledTimes(1);
      expect(groupService.getGroupIdsCanAccess).toBeCalledTimes(1);
      expect(PostModel.getTotalImportantPostInGroups).toBeCalledTimes(0);
      expect(mockTimelineResponse).toStrictEqual(mockedTimelineResponse);
    });

    it('Should return BadRequestException if group found post', async () => {
      jest.spyOn(groupService, 'get').mockResolvedValue(null);
      try {
      await feedService.getTimeline(mockedUserAuth, mockedGetTimeLineDto);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
      }
    });
  });

  // describe('User newsfeed', () => {
  //   it('Should get newsfeed successfully', async () => {
  //     const mockFindAllData = createMock<PostModel[]>(mockedNewsFeed);
  //     mockFindAllData.forEach((e) => {
  //       e.toJSON = () => e;
  //     });
  //     const jsonPosts = mockFindAllData.map((r) => r.toJSON());
  //     const postModelFindAllSpy = postModelMock.findAll.mockResolvedValue(mockFindAllData);
  //     const postModelCountSpy = postModelMock.count.mockResolvedValue(mockedNewsFeedResponse.meta.total);
  //     const result = await feedService.getNewsFeed(mockedUserAuth, mockedGetNewsFeedDto);
      
  //     expect(postModelFindAllSpy).toBeCalledTimes(1);
  //     expect(postModelCountSpy).toBeCalledTimes(1);
  //     expect(mentionService.bindMentionsToPosts).toBeCalledWith(jsonPosts);
  //     expect(postService.bindActorToPost).toBeCalledWith(jsonPosts);
  //     expect(postService.bindAudienceToPost).toBeCalledWith(jsonPosts);
  //     expect(result.meta).toStrictEqual(mockedNewsFeedResponse.meta);
  //   });

  //   it('Should return BadRequestException if group found post', async () => {
  //     const mockFindAllData = createMock<PostModel[]>(mockedNewsFeed);
  //     mockFindAllData.forEach((e) => {
  //       e.toJSON = () => e;
  //     });

  //     const postModelFindAllSpy = postModelMock.findAll.mockResolvedValue([]);
  //     const postModelCountSpy = postModelMock.count.mockResolvedValue(0);
  //     const result = await feedService.getNewsFeed(mockedUserAuth, mockedGetNewsFeedDto);
      
  //     expect(postModelFindAllSpy).toBeCalledTimes(1);
  //     expect(postModelCountSpy).toBeCalledTimes(1);
  //     expect(mentionService.bindMentionsToPosts).toBeCalledWith([]);
  //     expect(postService.bindActorToPost).toBeCalledWith([]);
  //     expect(postService.bindAudienceToPost).toBeCalledWith([]);
  //     expect(result.list).toStrictEqual([]);
  //     expect(result.meta.total).toStrictEqual(0);
  //   });
  // });
});
