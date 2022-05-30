import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { HTTP_STATUS_ID, KAFKA_PRODUCER } from '../../../common/constants';
import { PageDto } from '../../../common/dto/pagination/page.dto';
import { PostModel } from '../../../database/models/post.model';
import { PostService } from '../post.service';
import { GetPostDto } from './../dto/requests/get-post.dto';
import {
  mockedGroups,
  mockIPost,
  mockMediaModelArray,
  mockPostEditedHistoryModelArr,
  mockProcessVideoResponseDto,
} from './mocks/input.mock';
import { mockedCreatePostDto } from './mocks/request/create-post.dto.mock';
import { mockedUpdatePostDto } from './mocks/request/update-post.dto.mock';
import { mockedSearchResponse } from './mocks/response/search.response.mock';

import { RedisModule } from '@app/redis';
import { SentryService } from '@app/sentry';
import { createMock } from '@golevelup/ts-jest';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { EntityIdDto } from '../../../common/dto';
import { LogicException } from '../../../common/exceptions';
import { ElasticsearchHelper } from '../../../common/helpers';
import { PostEditedHistoryModel } from '../../../database/models/post-edited-history.model';
import { PostGroupModel } from '../../../database/models/post-group.model';
import { UserMarkReadPostModel } from '../../../database/models/user-mark-read-post.model';
import { GroupService } from '../../../shared/group';
import { UserService } from '../../../shared/user';
import { AuthorityService } from '../../authority';
import { CommentService } from '../../comment';
import { FeedService } from '../../feed/feed.service';
import { MediaService } from '../../media';
import { MentionService } from '../../mention';
import { ReactionService } from '../../reaction';
import { SearchPostsDto, UpdatePostDto } from '../dto/requests';
import { GetDraftPostDto } from '../dto/requests/get-draft-posts.dto';
import { PostPolicyService } from '../post-policy.service';

import { ClientKafka, ClientsModule } from '@nestjs/microservices';
import { mockGetPostEditedHistoryDto } from './mocks/request/get-post-edited-history.dto.mock';
import { mockedPostCreated } from './mocks/response/create-post.response.mock';
import { mockedPostData, mockedPostResponse } from './mocks/response/post.response.mock';
import { PostResponseDto } from '../dto/responses';
import { IMedia, MediaModel, MediaStatus, MediaType } from '../../../database/models/media.model';
import { mockedUserAuth } from './mocks/user.mock';
jest.mock('../article.service');
describe('PostService', () => {
  let postService: PostService;
  let postModelMock;
  let postGroupModelMock;
  let userMarkedImportantPostModelMock;
  let userService: UserService;
  let groupService: GroupService;
  let mediaService: MediaService;
  let mentionService: MentionService;
  let commentService: CommentService;
  let feedService: FeedService;
  let reactionService: ReactionService;
  let elasticSearchService: ElasticsearchService;
  let authorityService: AuthorityService;
  let transactionMock;
  let clientKafka;
  let sequelize: Sequelize;
  let postEditedHistoryModelMock: typeof PostEditedHistoryModel;
  let sentryService: SentryService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [RedisModule, ClientsModule],
      providers: [
        PostService,
        PostPolicyService,
        AuthorityService,
        {
          provide: ElasticsearchService,
          useClass: jest.fn(),
        },
        {
          provide: CommentService,
          useClass: jest.fn(),
        },
        {
          provide: FeedService,
          useClass: jest.fn(),
        },
        {
          provide: ReactionService,
          useClass: jest.fn(),
        },
        {
          provide: KAFKA_PRODUCER,
          useClass: jest.fn(),
        },
        {
          provide: UserService,
          useClass: jest.fn(),
        },
        {
          provide: GroupService,
          useClass: jest.fn(),
        },
        {
          provide: MediaService,
          useClass: jest.fn(),
        },
        {
          provide: MentionService,
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
          provide: SentryService,
          useValue: {
            captureException: jest.fn(),
          },
        },
        {
          provide: getModelToken(PostModel),
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
            findOne: jest.fn(),
            findByPk: jest.fn(),
            addMedia: jest.fn(),
            destroy: jest.fn(),
            findAll: jest.fn(),
            findAndCountAll: jest.fn(),
          },
        },
        {
          provide: getModelToken(PostGroupModel),
          useValue: {
            bulkCreate: jest.fn(),
            findAll: jest.fn(),
            destroy: jest.fn(),
          },
        },
        {
          provide: getModelToken(UserMarkReadPostModel),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            destroy: jest.fn(),
          },
        },
        {
          provide: getModelToken(PostEditedHistoryModel),
          useValue: {
            findAndCountAll: jest.fn(),
            create: jest.fn(),
            destroy: jest.fn(),
          },
        },
      ],
    }).compile();

    postService = moduleRef.get<PostService>(PostService);
    postModelMock = moduleRef.get<typeof PostModel>(getModelToken(PostModel));
    postGroupModelMock = moduleRef.get<typeof PostGroupModel>(getModelToken(PostGroupModel));
    postEditedHistoryModelMock = moduleRef.get<typeof PostEditedHistoryModel>(
      getModelToken(PostEditedHistoryModel)
    );
    userMarkedImportantPostModelMock = moduleRef.get<typeof UserMarkReadPostModel>(
      getModelToken(UserMarkReadPostModel)
    );
    userService = moduleRef.get<UserService>(UserService);
    groupService = moduleRef.get<GroupService>(GroupService);
    mentionService = moduleRef.get<MentionService>(MentionService);
    mediaService = moduleRef.get<MediaService>(MediaService);
    commentService = moduleRef.get<CommentService>(CommentService);
    feedService = moduleRef.get<FeedService>(FeedService);
    reactionService = moduleRef.get<ReactionService>(ReactionService);
    authorityService = moduleRef.get<AuthorityService>(AuthorityService);
    elasticSearchService = moduleRef.get<ElasticsearchService>(ElasticsearchService);
    sequelize = moduleRef.get<Sequelize>(Sequelize);
    clientKafka = moduleRef.get<ClientKafka>(KAFKA_PRODUCER);
    transactionMock = createMock<Transaction>({
      rollback: jest.fn(),
      commit: jest.fn(),
    });
    sentryService = moduleRef.get<SentryService>(SentryService);
    jest.spyOn(sequelize, 'transaction').mockResolvedValue(transactionMock);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(postService).toBeDefined();
  });

  describe('createPost', () => {
    it('Create post successfully', async () => {
      authorityService.checkCanCreatePost = jest.fn().mockResolvedValue(Promise.resolve());

      mediaService.checkValidMedia = jest.fn().mockResolvedValue(Promise.resolve());

      mediaService.sync = jest.fn().mockResolvedValue(Promise.resolve());
      mediaService.createIfNotExist = jest.fn().mockReturnThis();
      mentionService.create = jest.fn().mockResolvedValue(Promise.resolve());

      postService.addPostGroup = jest.fn().mockResolvedValue(Promise.resolve());

      postModelMock.create = jest.fn().mockResolvedValue(mockedPostCreated);

      await postService.createPost(mockedUserAuth, mockedCreatePostDto);

      expect(sequelize.transaction).toBeCalledTimes(1);
      expect(transactionMock.commit).toBeCalledTimes(1);
      expect(transactionMock.rollback).not.toBeCalled();
      expect(mediaService.sync).toBeCalledTimes(1);
      expect(mentionService.create).not.toBeCalled();
      expect(postService.addPostGroup).toBeCalledTimes(1);
      expect(postModelMock.create.mock.calls[0][0]).toStrictEqual({
        isDraft: true,
        content: mockedCreatePostDto.content,
        createdBy: mockedUserAuth.id,
        updatedBy: mockedUserAuth.id,
        isImportant: mockedCreatePostDto.setting.isImportant,
        importantExpiredAt: mockedCreatePostDto.setting.importantExpiredAt,
        canShare: mockedCreatePostDto.setting.canShare,
        canComment: mockedCreatePostDto.setting.canComment,
        canReact: mockedCreatePostDto.setting.canReact,
        isProcessing: false,
      });
    });

    it('Should catch exception if creator not found in cache', async () => {
      userService.get = jest.fn().mockResolvedValue(null);
      try {
        const result = await postService.createPost(
          { ...mockedUserAuth, profile: null },
          mockedCreatePostDto
        );
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
    });

    it('Should rollback if have an exception when insert data into DB', async () => {
      authorityService.checkCanCreatePost = jest.fn().mockResolvedValue(Promise.resolve());

      mediaService.checkValidMedia = jest.fn().mockResolvedValue(Promise.resolve());

      mentionService.create = jest.fn().mockResolvedValue(Promise.resolve());

      postModelMock.create = jest
        .fn()
        .mockRejectedValue(new Error('Any error when insert data to DB'));

      try {
        await postService.createPost(mockedUserAuth, mockedCreatePostDto);
      } catch (error) {
        expect(sequelize.transaction).toBeCalledTimes(1);
        expect(transactionMock.commit).not.toBeCalled();
        expect(transactionMock.rollback).toBeCalledTimes(1);
      }
    });
  });

  describe('updatePost', () => {
    it('Update post successfully', async () => {
      authorityService.checkCanUpdatePost = jest.fn().mockResolvedValue(Promise.resolve());

      mediaService.checkValidMedia = jest.fn().mockResolvedValue(Promise.resolve());

      mediaService.sync = jest.fn().mockResolvedValue(Promise.resolve());

      mentionService.create = jest.fn().mockResolvedValue(Promise.resolve());

      postService.setGroupByPost = jest.fn().mockResolvedValue(Promise.resolve());

      mediaService.getMediaList = jest.fn().mockResolvedValue(mockMediaModelArray);
      mediaService.createIfNotExist = jest.fn().mockResolvedValueOnce([
        {
          id: mockedUpdatePostDto.media.images[0].id,
          name: 'filename.jpg',
          origin: 'filename.jpg',
          size: 1000,
          url: 'http://googl.com',
          width: 100,
          type: MediaType.IMAGE,
          createdBy: mockedUserAuth.id,
          updatedBy: mockedUserAuth.id,
          height: 100,
          status: MediaStatus.COMPLETED,
        }
      ]);
      postModelMock.update.mockResolvedValueOnce(mockedPostCreated);

      postModelMock.update = jest.fn().mockResolvedValue(mockedPostCreated);

      await postService.updatePost(mockedPostResponse, mockedUserAuth, mockedUpdatePostDto);

      expect(sequelize.transaction).toBeCalledTimes(1);
      expect(transactionMock.commit).toBeCalledTimes(1);
      expect(transactionMock.rollback).not.toBeCalled();
      expect(mediaService.sync).toBeCalledTimes(1);
      expect(mentionService.create).not.toBeCalled();
      expect(postService.setGroupByPost).toBeCalledTimes(1);
      expect(postModelMock.update.mock.calls[0][0]).toStrictEqual({
        content: mockedUpdatePostDto.content,
        updatedBy: mockedUserAuth.id,
        isImportant: mockedCreatePostDto.setting.isImportant,
        importantExpiredAt: mockedCreatePostDto.setting.importantExpiredAt,
        canShare: mockedCreatePostDto.setting.canShare,
        canComment: mockedCreatePostDto.setting.canComment,
        canReact: mockedCreatePostDto.setting.canReact,
      });
    });

    it('Should catch exception if creator not found in cache', async () => {
      try {
        await postService.updatePost(
          mockedPostResponse,
          { ...mockedUserAuth, profile: null },
          mockedUpdatePostDto
        );
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
    });

    it('Should catch exception if groups is invalid', async () => {
      authorityService.checkCanUpdatePost = jest
        .fn()
        .mockRejectedValue(new Error('Not in the groups'));

      try {
        await postService.updatePost(mockedPostResponse, mockedUserAuth, mockedUpdatePostDto);
      } catch (e) {
        expect(e.message).toEqual('Not in the groups');
      }
    });

    it('Should rollback if have an exception when update data into DB', async () => {
      authorityService.checkCanUpdatePost = jest.fn().mockResolvedValue(Promise.resolve());

      mediaService.checkValidMedia = jest.fn().mockResolvedValue(Promise.resolve());

      mediaService.sync = jest.fn().mockResolvedValue(Promise.resolve());

      mentionService.create = jest.fn().mockResolvedValue(Promise.resolve());

      postService.setGroupByPost = jest.fn().mockResolvedValue(Promise.resolve());

      mediaService.getMediaList = jest.fn().mockResolvedValue(mockMediaModelArray);
      mediaService.createIfNotExist = jest.fn().mockResolvedValueOnce([
        {
          id: mockedUpdatePostDto.media.images[0].id,
          name: 'filename.jpg',
          origin: 'filename.jpg',
          size: 1000,
          url: 'http://googl.com',
          width: 100,
          type: MediaType.IMAGE,
          createdBy: mockedUserAuth.id,
          updatedBy: mockedUserAuth.id,
          height: 100,
          status: MediaStatus.COMPLETED,
        }
      ]);
      postModelMock.update = jest
        .fn()
        .mockRejectedValue(new Error('Any error when insert data to DB'));

      try {
        await postService.updatePost(mockedPostResponse, mockedUserAuth, mockedUpdatePostDto);
      } catch (e) {
        expect(sequelize.transaction).toBeCalledTimes(1);
        expect(transactionMock.commit).not.toBeCalledTimes(1);
        expect(transactionMock.rollback).toBeCalledTimes(1);
      }
    });
  });

  describe('publishPost', () => {
    const mockedDataUpdatePost = createMock<PostModel>(mockedPostData);
    const authUserId = mockedDataUpdatePost.createdBy;

    it('Should return result successfully', async () => {
      postModelMock.findOne = jest.fn().mockResolvedValue(mockedDataUpdatePost);

      mediaService.countMediaByPost = jest.fn().mockResolvedValueOnce(1);

      postModelMock.update = jest.fn().mockResolvedValue(mockedDataUpdatePost);

      const result = await postService.publishPost(
        mockedDataUpdatePost.id,
        mockedDataUpdatePost.createdBy
      );
      expect(result).toBe(true);

      expect(postModelMock.update).toHaveBeenCalledTimes(1);

      const [dataUpdate, condition]: any = postModelMock.update.mock.calls[0];
      expect(dataUpdate.isDraft).toStrictEqual(false);
      expect(condition.where).toStrictEqual({
        id: mockedDataUpdatePost.id,
        createdBy: authUserId,
      });
    });

    it('Should catch BadRequestException if content is null', async () => {
      postModelMock.findByPk = jest
        .fn()
        .mockResolvedValue({ ...mockedDataUpdatePost, content: null });

      mediaService.countMediaByPost = jest.fn().mockResolvedValueOnce(1);

      try {
        await postService.publishPost(mockedDataUpdatePost.id, authUserId);
      } catch (error) {
        expect(error).toBeInstanceOf(LogicException);
      }
    });

    it('Should catch NotFoundException if post not found', async () => {
      postModelMock.findByPk = jest.fn().mockResolvedValue(null);

      try {
        await postService.publishPost(mockedDataUpdatePost.id, authUserId);
      } catch (error) {
        expect(error).toBeInstanceOf(LogicException);
      }
    });

    it('Should catch ForbiddenException if user is not owner', async () => {
      postModelMock.findByPk = jest.fn().mockResolvedValue(mockedDataUpdatePost);
      mediaService.countMediaByPost = jest.fn().mockResolvedValueOnce(1);
      try {
        await postService.publishPost(mockedDataUpdatePost.id, authUserId);
      } catch (error) {
        expect(error).toBeInstanceOf(LogicException);
      }
    });
  });

  describe('deletePost', () => {
    const mockedDataDeletePost = createMock<PostModel>(mockedPostData);

    it('Delete post successfully', async () => {
      postService.checkPostOwner = jest.fn().mockResolvedValue(Promise.resolve());

      mentionService.setMention = jest.fn().mockResolvedValue(Promise.resolve());

      postService.setGroupByPost = jest.fn().mockResolvedValue(Promise.resolve());

      mediaService.sync = jest.fn().mockResolvedValue(Promise.resolve());

      reactionService.deleteReactionByPostIds = jest.fn().mockResolvedValue(Promise.resolve());

      commentService.deleteCommentsByPost = jest.fn().mockResolvedValue(Promise.resolve());

      feedService.deleteNewsFeedByPost = jest.fn().mockResolvedValue(Promise.resolve());

      userMarkedImportantPostModelMock.destroy = jest.fn().mockResolvedValue(mockedDataDeletePost);

      postModelMock.findByPk = jest.fn().mockResolvedValue(mockedDataDeletePost);

      const result = await postService.deletePost(mockedDataDeletePost.id, mockedUserAuth);

      expect(postModelMock.destroy).toHaveBeenCalledTimes(1);
      expect(mentionService.setMention).toHaveBeenCalledTimes(1);
      expect(mediaService.sync).toHaveBeenCalledTimes(1);
      expect(feedService.deleteNewsFeedByPost).toHaveBeenCalledTimes(1);
      expect(postService.setGroupByPost).toHaveBeenCalledTimes(1);
      expect(reactionService.deleteReactionByPostIds).toHaveBeenCalledTimes(1);
      expect(userMarkedImportantPostModelMock.destroy).toHaveBeenCalledTimes(1);
      expect(commentService.deleteCommentsByPost).toHaveBeenCalledTimes(1);
      expect(transactionMock.commit).toBeCalledTimes(1);
      const [condition] = postModelMock.destroy.mock.calls[0];
      expect(condition.where).toStrictEqual({
        id: mockedDataDeletePost.id,
        createdBy: mockedUserAuth.id,
      });
    });

    it('Should rollback if have exception', async () => {
      postModelMock.findOne = jest.fn().mockResolvedValueOnce(mockedDataDeletePost);
      postModelMock.destroy = jest
        .fn()
        .mockRejectedValue(new Error('Any error when insert data to DB'));
      try {
        await postService.deletePost(mockedDataDeletePost.id, mockedUserAuth);
      } catch (error) {
        expect(transactionMock.commit).not.toBeCalledTimes(1);
        expect(transactionMock.rollback).toBeCalledTimes(1);
      }
    });

    it('Should throw exception if user is not owner', async () => {
      postModelMock.findByPk = jest.fn().mockResolvedValueOnce(mockedDataDeletePost);
      mockedUserAuth.id = mockedDataDeletePost.createdBy + 1;
      try {
        await postService.deletePost(mockedDataDeletePost.id, mockedUserAuth);
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
    });

    it('Should throw exception if post not exist', async () => {
      postModelMock.findOne = jest.fn().mockResolvedValueOnce(null);
      try {
        await postService.deletePost('ad70928e-cffd-44a9-9b27-19faa7210530', mockedUserAuth);
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
    });
  });

  describe('addPostGroup', () => {
    it('Return if parameter is empty', async () => {
      const result = await postService.addPostGroup(
        [],
        'ad70928e-cffd-44a9-9b27-19faa7210530',
        transactionMock
      );
      expect(result).toBe(true);
    });

    it('Return if parameter is empty', async () => {
      const result = await postService.addPostGroup(
        [1, 2],
        'ad70928e-cffd-44a9-9b27-19faa7210530',
        transactionMock
      );
      expect(postGroupModelMock.bulkCreate).toBeCalledTimes(1);
      expect(result).toBe(true);
    });
  });

  describe('setGroupByPost', () => {
    it('Should excute query', async () => {
      const currentGroupPost = [
        {
          postId: 'ad70928e-cffd-44a9-9b27-19faa7210530',
          groupId: 1,
        },
        {
          postId: 'ad70928e-cffd-44a9-9b27-19faa7210530',
          groupId: 2,
        },
      ];

      const mockData = {
        groupIds: [1, 3],
        postId: 'ad70928e-cffd-44a9-9b27-19faa7210530',
      };

      postGroupModelMock.findAll = jest.fn().mockResolvedValue(currentGroupPost);

      const result = await postService.setGroupByPost(
        mockData.groupIds,
        mockData.postId,
        transactionMock
      );

      expect(result).toBe(true);
      expect(postGroupModelMock.destroy).toBeCalledTimes(1);
      expect(postGroupModelMock.bulkCreate).toBeCalledTimes(1);

      const [condition] = postGroupModelMock.destroy.mock.calls[0];
      expect(condition.where).toStrictEqual({
        groupId: [2],
        postId: mockData.postId,
      });

      const createPostQuery: any = postGroupModelMock.bulkCreate.mock.calls[0][0];

      expect(createPostQuery).toStrictEqual([
        {
          groupId: 3,
          postId: mockData.postId,
        },
      ]);
    });
  });

  describe('findPost', () => {
    const entity: EntityIdDto = {
      postId: 'ad70928e-cffd-44a9-9b27-19faa7210530',
      commentId: '09817de6-40f0-445e-82dd-d40e155ec35a',
      reactionCommentId: '4e93c760-443e-4ccb-bc9c-d79cbe039a0f',
      reactionPostId: 'af914610-84ce-4fb7-8447-931afafd89e7',
    };

    it('Should get post successfully', async () => {
      const mockedPost = createMock<PostModel>(mockedPostCreated);
      postModelMock.findOne.mockResolvedValueOnce(mockedPost);
      const result = await postService.findPost(entity);
      expect(postModelMock.findOne).toBeCalledTimes(1);
    });

    it('Catch exception', async () => {
      postModelMock.findOne.mockResolvedValueOnce(null);
      try {
        const result = await postService.findPost(entity);
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
    });
  });

  describe('searchPosts', () => {
    it('Should search post successfully', async () => {
      const searchDto: SearchPostsDto = {
        content: 'aaa',
        offset: 0,
        limit: 1,
      };
      elasticSearchService.search = jest.fn().mockResolvedValue(mockedSearchResponse);
      const mockPosts = mockedSearchResponse.body.hits.hits.map((item) => {
        const source = item._source;
        source['id'] = parseInt(item._id);
        source['highlight'] = item.highlight['content'][0];
        return source;
      });
      userService.get = jest.fn().mockResolvedValue(mockedUserAuth);
      postService.getPayloadSearch = jest.fn();

      postService.bindActorToPost = jest.fn();
      postService.bindAudienceToPost = jest.fn();
      postService.bindCommentsCount = jest.fn();

      const result = await postService.searchPosts(mockedUserAuth, searchDto);

      expect(postService.getPayloadSearch).toBeCalledTimes(1);
      expect(elasticSearchService.search).toBeCalledTimes(1);
      expect(postService.getPayloadSearch).toBeCalledWith(searchDto, mockedUserAuth.profile.groups);

      expect(postService.bindActorToPost).toBeCalledTimes(1);
      expect(postService.bindActorToPost).toBeCalledWith(mockPosts);
      expect(postService.bindAudienceToPost).toBeCalledTimes(1);
      expect(postService.bindCommentsCount).toBeCalledTimes(1);
      expect(postService.bindAudienceToPost).toBeCalledWith(mockPosts);
      expect(result).toBeInstanceOf(PageDto);

      expect(result.list[0]).toBeInstanceOf(PostResponseDto);
    });
    it('Should return []', async () => {
      const searchDto: SearchPostsDto = {
        content: 'aaa',
        offset: 0,
        limit: 1,
      };
      mockedUserAuth.profile = null;
      elasticSearchService.search = jest.fn().mockResolvedValue(mockedSearchResponse);
      const result = await postService.searchPosts(mockedUserAuth, searchDto);
      expect(elasticSearchService.search).not.toBeCalled();
      expect(result).toBeInstanceOf(PageDto);

      expect(result.list).toStrictEqual([]);
    });
  });

  describe('getPayloadSearch', () => {
    it('Should return payload correctly with no content, actor, time', async () => {
      const searchDto: SearchPostsDto = {
        offset: 0,
        limit: 1,
      };
      const expectedResult = {
        index: ElasticsearchHelper.INDEX.POST,
        body: {
          query: {
            bool: {
              filter: [
                {
                  terms: {
                    'audience.groups.id': [1],
                  },
                },
              ],
              must: [],
              should: [],
            },
          },
          sort: [{ createdAt: 'desc' }],
        },
        from: 0,
        size: 1,
      };
      const result = await postService.getPayloadSearch(searchDto, [1]);
      expect(result).toStrictEqual(expectedResult);
    });

    it('Should return payload correctly with actor', async () => {
      const searchDto: SearchPostsDto = {
        offset: 0,
        limit: 1,
        actors: [1],
      };
      const expectedResult = {
        index: ElasticsearchHelper.INDEX.POST,
        body: {
          query: {
            bool: {
              filter: [
                {
                  terms: {
                    'actor.id': [1],
                  },
                },
                {
                  terms: {
                    'audience.groups.id': [1],
                  },
                },
              ],
              must: [],
              should: [],
            },
          },
          sort: [{ createdAt: 'desc' }],
        },
        from: 0,
        size: 1,
      };
      const result = await postService.getPayloadSearch(searchDto, [1]);
      expect(result).toStrictEqual(expectedResult);
    });

    it('Should return payload correctly with time', async () => {
      const searchDto: SearchPostsDto = {
        offset: 0,
        limit: 1,
        startTime: '2022-03-23T17:00:00.000Z',
        endTime: '2022-03-25T17:00:00.000Z',
      };
      const expectedResult = {
        index: ElasticsearchHelper.INDEX.POST,
        body: {
          query: {
            bool: {
              must: [
                {
                  range: {
                    createdAt: {
                      gte: '2022-03-23T17:00:00.000Z',
                      lte: '2022-03-25T17:00:00.000Z',
                    },
                  },
                },
              ],
              filter: [
                {
                  terms: {
                    'audience.groups.id': [1],
                  },
                },
              ],
              should: [],
            },
          },
          sort: [{ createdAt: 'desc' }],
        },
        from: 0,
        size: 1,
      };
      const result = await postService.getPayloadSearch(searchDto, [1]);
      expect(result).toStrictEqual(expectedResult);
    });

    it('Should return payload correctly with content', async () => {
      const searchDto: SearchPostsDto = {
        offset: 0,
        limit: 1,
        content: 'aaaa',
      };
      const expectedResult = {
        index: ElasticsearchHelper.INDEX.POST,
        body: {
          query: {
            bool: {
              must: [],
              filter: [
                {
                  terms: {
                    'audience.groups.id': [1],
                  },
                },
              ],
              should: [
                {
                  dis_max: {
                    queries: [
                      {
                        match: {
                          content: 'aaaa',
                        },
                      },
                      {
                        match: {
                          'content.ascii': {
                            query: 'aaaa',
                            boost: 0.6,
                          },
                        },
                      },
                      {
                        match: {
                          'content.ngram': {
                            query: 'aaaa',
                            boost: 0.3,
                          },
                        },
                      },
                    ],
                  },
                },
              ],
              minimum_should_match: 1,
            },
          },
          highlight: {
            pre_tags: ['=='],
            post_tags: ['=='],
            fields: {
              content: {
                matched_fields: ['content', 'content.ascii', 'content.ngram'],
                type: 'fvh',
                number_of_fragments: 0,
              },
            },
          },
          sort: [{ _score: 'desc' }, { createdAt: 'desc' }],
        },
        from: 0,
        size: 1,
      };
      const result = await postService.getPayloadSearch(searchDto, [1]);
      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe('getDraftPost', () => {
    const postData = mockedPostData;
    const getDraftPostsDto: GetDraftPostDto = {
      limit: 1,
    };

    it('Should get post successfully', async () => {
      const mockPosts = [
        {
          ...postData,
          toJSON: () => postData,
        },
      ];
      postModelMock.findAndCountAll.mockResolvedValue({
        rows: mockPosts,
        count: 1,
      });

      postService.bindActorToPost = jest.fn();
      postService.bindAudienceToPost = jest.fn();
      mentionService.bindMentionsToPosts = jest.fn().mockResolvedValue(Promise.resolve());

      const result = await postService.getDraftPosts(mockedUserAuth.id, getDraftPostsDto);

      expect(mentionService.bindMentionsToPosts).toBeCalledTimes(1);
      expect(mentionService.bindMentionsToPosts).toBeCalledWith([postData]);
      expect(postService.bindActorToPost).toBeCalledTimes(1);
      expect(postService.bindActorToPost).toBeCalledWith([postData]);
      expect(postService.bindAudienceToPost).toBeCalledTimes(1);
      expect(postService.bindAudienceToPost).toBeCalledWith([postData]);
      expect(result).toBeInstanceOf(PageDto);
      expect(result.list[0]).toBeInstanceOf(PostResponseDto);
    });
  });

  describe('getPost', () => {
    const getPostDto: GetPostDto = {
      commentLimit: 1,
      childCommentLimit: 1,
      withComment: true,
    };

    it('Should get post successfully', async () => {
      postModelMock.findOne = jest.fn().mockResolvedValue({
        ...mockedPostResponse,
        toJSON: () => mockedPostResponse,
      });

      authorityService.checkCanReadPost = jest.fn().mockResolvedValue(Promise.resolve());

      commentService.getComments = jest.fn().mockResolvedValue(mockedPostResponse.comments);

      postService.bindActorToPost = jest.fn().mockResolvedValue(Promise.resolve());

      postService.bindAudienceToPost = jest.fn().mockResolvedValue(Promise.resolve());

      reactionService.bindReactionToPosts = jest.fn().mockResolvedValue(Promise.resolve());

      mentionService.bindMentionsToPosts = jest.fn().mockResolvedValue(Promise.resolve());

      postService.bindActorToPost = jest.fn();
      postService.bindAudienceToPost = jest.fn();

      const result = await postService.getPost(mockedPostData.id, mockedUserAuth, getPostDto);

      expect(result.comments).toStrictEqual(mockedPostResponse.comments);
      expect(postService.bindActorToPost).toBeCalledTimes(1);
      expect(postService.bindAudienceToPost).toBeCalledTimes(1);
      expect(reactionService.bindReactionToPosts).toBeCalledTimes(1);
      expect(mentionService.bindMentionsToPosts).toBeCalledTimes(1);
    });

    it('Post not found', async () => {
      postModelMock.findOne = jest.fn().mockResolvedValueOnce(null);
      try {
        await postService.getPost(mockedPostData.id, mockedUserAuth, getPostDto);
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
    });

    it('Catch ForbiddenException when access a post in invalid group', async () => {
      postModelMock.findOne = jest.fn().mockResolvedValueOnce({
        ...mockedPostResponse,
      });

      authorityService.checkCanReadPost = jest
        .fn()
        .mockRejectedValueOnce(
          new LogicException('You do not have permission to perform this action !')
        );

      try {
        await postService.getPost(mockedPostResponse.id, mockedUserAuth, getPostDto);
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
    });
  });

  describe('bindActorToPost', () => {
    const posts = [{ createdBy: 1, actor: null }];
    it('Should bind actor successfully', async () => {
      userService.getMany = jest.fn().mockResolvedValueOnce([
        {
          id: 1,
        },
      ]);
      await postService.bindActorToPost(posts);
      expect(posts[0].actor).toStrictEqual({ id: 1 });
    });
  });

  describe('bindCommentsCount', () => {
    const posts = [{ id: 1, commentsCount: 0 }];
    it('Should bind actor successfully', async () => {
      postModelMock.findAll.mockResolvedValueOnce(posts);
      await postService.bindCommentsCount(posts);
      expect(posts[0].commentsCount).toStrictEqual(posts[0].commentsCount);
    });
  });

  describe('bindAudienceToPost', () => {
    const posts = [
      {
        audience: null,
        groups: [
          {
            id: mockedGroups[0].id,
          },
        ],
      },
    ];

    it('Should bind audience successfully', async () => {
      groupService.getMany = jest.fn().mockResolvedValueOnce(mockedGroups);
      await postService.bindAudienceToPost(posts);
      expect(posts[0].audience.groups).toStrictEqual([mockedGroups[0]]);
    });
  });

  describe('processVideo', () => {
    it('Should successfully', async () => {
      clientKafka.emit = jest.fn().mockResolvedValue(Promise.resolve());
      mediaService.updateData = jest.fn().mockResolvedValue(Promise.resolve());

      await postService.processVideo([
        '4cfcadc9-a8f9-49f4-b037-bd02ce96022d',
        '658a1165-ae1d-4e4b-b369-d3c296533fb2',
      ]);

      expect(clientKafka.emit).toBeCalledTimes(1);
      expect(mediaService.updateData).toBeCalledTimes(1);
    });

    it('Should failed if have an error connecting to DB', async () => {
      clientKafka.emit = jest.fn().mockResolvedValue(Promise.resolve());
      mediaService.updateData = jest.fn().mockRejectedValue(new Error('Error when connect to DB'));
      sentryService.captureException = jest.fn().mockResolvedValue(Promise.resolve());

      try {
        await postService.processVideo([
          '4cfcadc9-a8f9-49f4-b037-bd02ce96022d',
          '658a1165-ae1d-4e4b-b369-d3c296533fb2',
        ]);
      } catch (e) {
        expect(e?.message).toEqual('Error when connect to DB');
      }

      expect(mediaService.updateData).toBeCalledTimes(1);
      expect(clientKafka.emit).toBeCalledTimes(1);
      expect(sentryService.captureException).toBeCalledTimes(1);
    });
  });

  describe('videoPostFail', () => {
    it('Should successfully', async () => {
      mediaService.updateData = jest.fn().mockResolvedValue(Promise.resolve());

      postService.getPostsByMedia = jest
        .fn()
        .mockResolvedValue([
          { id: '6020620d-142d-4f63-89f0-b63d24d60916' },
          { id: 'f6843473-58dc-49c8-a5c9-58d0be4673c1' },
        ]);

      postService.updatePostStatus = jest.fn().mockResolvedValue(Promise.resolve());

      await postService.videoPostFail(mockProcessVideoResponseDto);

      expect(mediaService.updateData).toBeCalledTimes(1);
      expect(postService.getPostsByMedia).toBeCalledTimes(1);
      expect(postService.updatePostStatus).toBeCalledTimes(2);
    });
  });

  describe('videoPostSuccess', () => {
    it('Should successfully', async () => {
      mediaService.updateData = jest.fn().mockResolvedValue(Promise.resolve());

      postService.getPostsByMedia = jest
        .fn()
        .mockResolvedValue([
          { id: '6020620d-142d-4f63-89f0-b63d24d60916' },
          { id: 'f6843473-58dc-49c8-a5c9-58d0be4673c1' },
        ]);

      postService.updatePostStatus = jest.fn().mockResolvedValue(Promise.resolve());

      await postService.videoPostSuccess(mockProcessVideoResponseDto);

      expect(mediaService.updateData).toBeCalledTimes(1);
      expect(postService.getPostsByMedia).toBeCalledTimes(1);
      expect(postService.updatePostStatus).toBeCalledTimes(2);
    });
  });

  describe('getPostsByMedia', () => {
    it('Should successfully', async () => {
      postModelMock.findAll = jest.fn().mockResolvedValue([{ toJSON: () => ({}) }]);

      postService.bindAudienceToPost = jest.fn().mockResolvedValue(Promise.resolve());

      mentionService.bindMentionsToPosts = jest.fn().mockResolvedValue(Promise.resolve());

      postService.bindActorToPost = jest.fn().mockResolvedValue(Promise.resolve());

      await postService.getPostsByMedia('d3c1fa78-de9b-4f40-ad97-ee4dc19e36d9');

      expect(postModelMock.findAll).toBeCalledTimes(1);
      expect(postService.bindAudienceToPost).toBeCalledTimes(1);
      expect(mentionService.bindMentionsToPosts).toBeCalledTimes(1);
      expect(postService.bindActorToPost).toBeCalledTimes(1);
    });
  });

  describe('getTotalImportantPostInNewsFeed', () => {
    it('Should successfully', async () => {
      sequelize.query = jest.fn().mockResolvedValue([{ total: 20 }]);

      const result = await postService.getTotalImportantPostInNewsFeed(1, '');

      expect(sequelize.query).toBeCalledTimes(1);
      expect(result).toEqual(20);
    });
  });

  describe('getTotalImportantPostInGroups', () => {
    it('Should successfully', async () => {
      sequelize.query = jest.fn().mockResolvedValue([{ total: 20 }]);

      const result = await postService.getTotalImportantPostInGroups(1, [2, 3]);

      expect(sequelize.query).toBeCalledTimes(1);
      expect(result).toEqual(20);
    });
  });

  // describe('markReadPost', () => {
  //   it('Should successfully', async () => {

  //   });
  // });

  // describe('findPostIdsByGroupId', () => {});

  describe('getPostEditedHistory', () => {
    it('Should successfully', async () => {
      postService.findPost = jest.fn().mockResolvedValue(mockIPost);

      postService.checkPostOwner = jest.fn().mockResolvedValue(Promise.resolve());

      postEditedHistoryModelMock.findAndCountAll = jest.fn().mockResolvedValue({
        rows: mockPostEditedHistoryModelArr,
        count: mockPostEditedHistoryModelArr.length,
      });

      const result = await postService.getPostEditedHistory(
        mockedUserAuth,
        mockIPost.id,
        mockGetPostEditedHistoryDto
      );

      expect(postService.checkPostOwner).toBeCalledTimes(1);
      expect(postService.findPost).toBeCalledTimes(1);
    });

    it('User not in post groups', async () => {
      postService.findPost = jest.fn().mockResolvedValue(mockIPost);

      postService.checkPostOwner = jest
        .fn()
        .mockRejectedValue(new Error(HTTP_STATUS_ID.API_FORBIDDEN));

      postEditedHistoryModelMock.findAndCountAll = jest
        .fn()
        .mockResolvedValue({ rows: [], count: 0 });

      try {
        await postService.getPostEditedHistory(
          mockedUserAuth,
          mockIPost.id,
          mockGetPostEditedHistoryDto
        );
      } catch (e) {
        expect(e.message).toEqual(HTTP_STATUS_ID.API_FORBIDDEN);
      }

      expect(postService.checkPostOwner).toBeCalledTimes(1);
      expect(postService.findPost).toBeCalledTimes(1);
    });
  });


  describe('checkContent', () => {
    it('Should successfully', async () => {
      const updatePostDto: UpdatePostDto = {
        content: '',
        audience: {
          groupIds: [1],
        },
        media: {
          images: [],
          files: [],
          videos: []
        }
      }
      try{
      const result = postService.checkContent(updatePostDto);
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
      
    });
  });
});
