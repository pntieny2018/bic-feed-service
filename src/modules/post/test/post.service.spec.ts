import { PageDto } from '../../../common/dto/pagination/page.dto';
import { GetPostDto } from './../dto/requests/get-post.dto';
import { mockedGroups } from './mocks/data/groups.mock';
import { HTTP_STATUS_ID, KAFKA_PRODUCER, MentionableType } from '../../../common/constants';
import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from '../post.service';
import { IPost, PostModel } from '../../../database/models/post.model';
import { getModelToken } from '@nestjs/sequelize';
import { mockedCreatePostDto } from './mocks/request/create-post.dto.mock';
import { mockedUpdatePostDto } from './mocks/request/update-post.dto.mock';
import { mockedSearchResponse } from './mocks/response/search.response.mock';

import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { createMock } from '@golevelup/ts-jest';
import { SentryService } from '@app/sentry';
import { RedisModule } from '@app/redis';
import { UserService } from '../../../shared/user';
import { GroupService } from '../../../shared/group';
import { MediaService } from '../../media';
import { MentionService } from '../../mention';
import { Transaction } from 'sequelize';
import { PostGroupModel } from '../../../database/models/post-group.model';
import { EntityIdDto } from '../../../common/dto';
import { CommentModule, CommentService } from '../../comment';
import { AuthorityService } from '../../authority';
import { PostPolicyService } from '../post-policy.service';
import { GetDraftPostDto } from '../dto/requests/get-draft-posts.dto';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { SearchPostsDto } from '../dto/requests';
import { ElasticsearchHelper } from '../../../common/helpers';
import { EntityType } from '../../media/media.constants';
import { FeedService } from '../../feed/feed.service';
import { UserMarkReadPostModel } from '../../../database/models/user-mark-read-post.model';
import { LogicException } from '../../../common/exceptions';
import { Sequelize } from 'sequelize-typescript';
import { PostEditedHistoryModel } from '../../../database/models/post-edited-history.model';
import { ReactionService } from '../../reaction';

import { ClientKafka, ClientsModule } from '@nestjs/microservices';
import { authUserMock } from '../../comment/tests/mocks/user.mock';
import { mockedPostCreated } from './mocks/response/create-post.response.mock';
import { mockedUserAuth } from './mocks/data/user-auth.mock';
import { mockedPostData, mockedPostResponse } from './mocks/response/post.response.mock';
import { PostResponseDto } from '../dto/responses';
import { IMedia, MediaModel, MediaStatus, MediaType } from '../../../database/models/media.model';
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
  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [RedisModule, ClientsModule],
      providers: [
        PostService,
        PostPolicyService,
        AuthorityService,
        {
          provide: ElasticsearchService,
          useValue: {
            search: jest.fn(),
          },
        },
        {
          provide: CommentService,
          useValue: {
            getComments: jest.fn(),
            deleteCommentsByPost: jest.fn(),
          },
        },
        {
          provide: FeedService,
          useValue: {
            deleteNewsFeedByPost: jest.fn(),
          },
        },
        {
          provide: ReactionService,
          useValue: {
            bindReactionToPosts: jest.fn(),
            deleteReactionByPostIds: jest.fn()
          },
        },
        {
          provide: KAFKA_PRODUCER,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            get: jest.fn(),
            getMany: jest.fn(),
          },
        },
        {
          provide: GroupService,
          useValue: {
            get: jest.fn(),
            getMany: jest.fn(),
            isMemberOfGroups: jest.fn(),
            getGroupIdsCanAccess: jest.fn(),
          },
        },
        {
          provide: MediaService,
          useValue: {
            checkValidMedia: jest.fn(),
            countMediaByPost: jest.fn(),
            sync: jest.fn(),
            getMediaList: jest.fn(),
          },
        },
        {
          provide: MentionService,
          useValue: {
            checkValidMentions: jest.fn(),
            bindMentionsToPosts: jest.fn(),
            setMention: jest.fn(),
            create: jest.fn()
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
      jest.spyOn(authorityService, 'checkCanCreatePost').mockReturnThis();
      jest.spyOn(mediaService, 'checkValidMedia').mockReturnThis();
      jest.spyOn(mediaService, 'sync').mockReturnThis();
      jest.spyOn(mentionService, 'create').mockReturnThis();
      jest.spyOn(postService, 'addPostGroup').mockReturnThis();
      postModelMock.create.mockResolvedValueOnce(mockedPostCreated)

      await postService.createPost(mockedUserAuth, mockedCreatePostDto);
      expect(sequelize.transaction).toBeCalledTimes(1);
      expect(transactionMock.commit).toBeCalledTimes(1);
      expect(transactionMock.rollback).not.toBeCalled();
      expect(mediaService.sync).toBeCalledTimes(1);
      expect(mentionService.create).not.toBeCalled();
      expect(postService.addPostGroup).toBeCalledTimes(1);
      expect(postModelMock.create.mock.calls[0][0]).toStrictEqual({ isDraft: true,
        content: mockedCreatePostDto.content,
        createdBy: mockedUserAuth.id,
        updatedBy: mockedUserAuth.id,
        isImportant: mockedCreatePostDto.setting.isImportant,
        importantExpiredAt: mockedCreatePostDto.setting.importantExpiredAt,
        canShare: mockedCreatePostDto.setting.canShare,
        canComment: mockedCreatePostDto.setting.canComment,
        canReact: mockedCreatePostDto.setting.canReact,
        isProcessing: false 
      })
    });

    it('Should catch exception if creator not found in cache', async () => {
      userService.get = jest.fn().mockResolvedValue(null);
      authUserMock.profile = null;
      try {
        const result = await postService.createPost(authUserMock, mockedCreatePostDto);
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
    });

    it('Should rollback if have an exception when insert data into DB', async () => {
      jest.spyOn(authorityService, 'checkCanCreatePost').mockReturnThis();
      jest.spyOn(mediaService, 'checkValidMedia').mockReturnThis();
      jest.spyOn(mentionService, 'create').mockReturnThis();
      postModelMock.create.mockRejectedValue(new Error('Any error when insert data to DB'));

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
    const mockedDataUpdatePost = createMock<PostModel>(mockedPostData);
    const mockedMedia= createMock<MediaModel[]>([
      {
        id: 1,
        url: "aaaa",
        name: "aaa",
        isDraft: false,
        type: MediaType.IMAGE,
        status: MediaStatus.COMPLETED,
        createdBy: mockedUserAuth.id,
      }
    ])
    it('Update post successfully', async () => {
      jest.spyOn(authorityService, 'checkCanUpdatePost').mockReturnThis();
      jest.spyOn(mediaService, 'checkValidMedia').mockReturnThis();
      jest.spyOn(mediaService, 'sync').mockReturnThis();
      jest.spyOn(mentionService, 'create').mockReturnThis();
      jest.spyOn(postService, 'setGroupByPost').mockReturnThis();
      jest.spyOn(mediaService, 'getMediaList').mockResolvedValueOnce(mockedMedia);
      postModelMock.update.mockResolvedValueOnce(mockedPostCreated)
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
        canReact: mockedCreatePostDto.setting.canReact
      })
    });

    it('Should catch exception if creator not found in cache', async () => {
      
    });

    it('Should catch exception if groups is invalid', async () => {
      
    });

    it('Should rollback if have an exception when update data into DB', async () => {
      // const mockedDataUpdatePost = createMock<PostModel>(mockedPostList[0]);
      // groupService.isMemberOfGroups = jest.fn().mockResolvedValue(true);
      // mediaService.checkValidMedia = jest.fn().mockResolvedValue(true);
      // postModelMock.findOne.mockResolvedValueOnce(mockedDataUpdatePost);

      // postModelMock.update.mockRejectedValue(new Error('Any error when insert data to DB'));

      // try {
      //   await postService.updatePost(mockedDataUpdatePost.id, mockedUserAuth, mockedCreatePostDto);

      //   expect(sequelize.transaction).toBeCalledTimes(1);
      //   expect(transactionMock.commit).not.toBeCalled();
      // } catch (error) {
      //   expect(transactionMock.rollback).toBeCalledTimes(1);
      // }
    });
  });

  describe('publishPost', () => {
    const mockedDataUpdatePost = createMock<PostModel>(mockedPostData);
    const authUserId = mockedDataUpdatePost.createdBy;
    it('Should return result successfully', async () => {
      postModelMock.findOne.mockResolvedValueOnce(mockedDataUpdatePost);
      mediaService.countMediaByPost = jest.fn().mockResolvedValueOnce(1);
      postModelMock.update.mockResolvedValueOnce(mockedDataUpdatePost);

      const result = await postService.publishPost(mockedDataUpdatePost.id, mockedDataUpdatePost.createdBy);
      expect(result).toBe(true);

      expect(postModelMock.update).toHaveBeenCalledTimes(1);

      const [dataUpdate, condition]: any = postModelMock.update.mock.calls[0];
      expect(dataUpdate).toStrictEqual({
        isDraft: false,
      });
      expect(condition.where).toStrictEqual({
        id: mockedDataUpdatePost.id,
        createdBy: authUserId,
      });
    });

    it('Should catch BadRequestException if content is null', async () => {
      // mockedDataUpdatePost.content = null;
      // postModelMock.findByPk.mockResolvedValueOnce(mockedDataUpdatePost);
      // mediaService.countMediaByPost = jest.fn().mockResolvedValueOnce(1);
      // try {
      //   await postService.publishPost(mockedDataUpdatePost.id, authUserId);
      // } catch (error) {
      //   expect(error).toBeInstanceOf(LogicException);
      // }
    });

    it('Should catch NotFoundException if post not found', async () => {
      // postModelMock.findByPk.mockResolvedValueOnce(null);
      // try {
      //   await postService.publishPost(mockedDataUpdatePost.id, authUserId);
      // } catch (error) {
      //   expect(error).toBeInstanceOf(LogicException);
      // }
    });

    it('Should catch ForbiddenException if user is not owner', async () => {
      // postModelMock.findByPk.mockResolvedValueOnce(mockedDataUpdatePost);
      // mediaService.countMediaByPost = jest.fn().mockResolvedValueOnce(1);
      // try {
      //   await postService.publishPost(mockedDataUpdatePost.id, authUserId);
      // } catch (error) {
      //   expect(error).toBeInstanceOf(LogicException);
      // }
    });
  });

  describe('deletePost', () => {
    const mockedDataDeletePost = createMock<PostModel>(mockedPostData);
    it('Delete post successfully', async () => {
      jest.spyOn(postService, 'checkPostOwner').mockReturnThis();
      jest.spyOn(mentionService, 'setMention').mockReturnThis();
      jest.spyOn(postService, 'setGroupByPost').mockReturnThis();
      jest.spyOn(mediaService, 'sync').mockReturnThis();

      jest.spyOn(reactionService, 'deleteReactionByPostIds').mockReturnThis();
      jest.spyOn(commentService, 'deleteCommentsByPost').mockReturnThis();
      jest.spyOn(feedService, 'deleteNewsFeedByPost').mockReturnThis();

      userMarkedImportantPostModelMock.destroy.mockResolvedValueOnce(mockedDataDeletePost)

      postModelMock.findByPk.mockResolvedValueOnce(mockedDataDeletePost);

      const result = await postService.deletePost(
        mockedDataDeletePost.id,
        mockedUserAuth
      );
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
      postModelMock.findOne.mockResolvedValueOnce(mockedDataDeletePost);
      postModelMock.destroy.mockRejectedValue(new Error('Any error when insert data to DB'));
      try {
        await postService.deletePost(mockedDataDeletePost.id, mockedUserAuth);
      } catch (error) {
        expect(transactionMock.commit).not.toBeCalledTimes(1);
        expect(transactionMock.rollback).toBeCalledTimes(1);
      }
    });

    it('Should throw exception if user is not owner', async () => {
      postModelMock.findByPk.mockResolvedValueOnce(mockedDataDeletePost);
      mockedUserAuth.id = mockedDataDeletePost.createdBy + 1;
      try {
        await postService.deletePost(mockedDataDeletePost.id, mockedUserAuth);
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
    });

    it('Should throw exception if post not exist', async () => {
      postModelMock.findOne.mockResolvedValueOnce(null);
      try {
        await postService.deletePost(1, mockedUserAuth);
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
    });
  });

  describe('addPostGroup', () => {
    it('Return if parameter is empty', async () => {
      const result = await postService.addPostGroup([], 1, transactionMock);
      expect(result).toBe(true);
    });

    it('Return if parameter is empty', async () => {
      const result = await postService.addPostGroup([1, 2], 1, transactionMock);
      expect(postGroupModelMock.bulkCreate).toBeCalledTimes(1);
      expect(result).toBe(true);
    });
  });

  describe('setGroupByPost', () => {
    it('Should excute query', async () => {
      const currentGroupPost = createMock<PostGroupModel[]>([
        {
          postId: 1,
          groupId: 1,
        },
        {
          postId: 1,
          groupId: 2,
        },
      ]);
      const mockData = {
        groupIds: [1, 3],
        postId: 1,
      };
      postGroupModelMock.findAll.mockResolvedValueOnce(currentGroupPost);
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
      postId: 1,
      commentId: 1,
      reactionCommentId: 1,
      reactionPostId: 1,
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
      const result = await postService.getDraftPosts(postData.id, getDraftPostsDto);
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
      withComment: true
    };
    
    it('Should get post successfully', async () => {
      postModelMock.findOne.mockResolvedValueOnce({
        ...mockedPostResponse,
        toJSON: () => mockedPostResponse,
      });
      jest.spyOn(authorityService, 'checkCanReadPost').mockReturnThis()
      jest.spyOn(commentService, 'getComments').mockResolvedValueOnce(mockedPostResponse.comments);
      jest.spyOn(postService, 'bindActorToPost').mockReturnThis;
      jest.spyOn(postService, 'bindAudienceToPost').mockReturnThis();
      jest.spyOn(reactionService, 'bindReactionToPosts').mockReturnThis();
      jest.spyOn(mentionService, 'bindMentionsToPosts').mockReturnThis();
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
      postModelMock.findOne.mockResolvedValueOnce(null);
      try {
        await postService.getPost(mockedPostData.id, mockedUserAuth, getPostDto);
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
    });

    it('Catch ForbiddenException when access a post in invalid group', async () => {
      postModelMock.findOne.mockResolvedValueOnce({
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
          id:1
        }
      ]);
      await postService.bindActorToPost(posts);
      expect(posts[0].actor).toStrictEqual({id:1});
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

//   describe('getPostEditedHistory', () => {
//     it('User not in post groups', async () => {
//       postService.findPost = jest.fn().mockResolvedValue(mockPostFindOne);
//       postService.checkPostOwner = jest
//         .fn()
//         .mockRejectedValue(new Error(HTTP_STATUS_ID.API_FORBIDDEN));
//       postEditedHistoryModelMock.findAndCountAll = jest
//         .fn()
//         .mockResolvedValue({ rows: [], count: 0 });
//       try {
//         await postService.getPostEditedHistory(
//           mockUserDto,
//           mockPostFindOne.id,
//           mockGetPostEditedHistoryDto
//         );
//       } catch (e) {
//         console.log(e);
//       }
//       expect(postService.checkPostOwner).toBeCalledTimes(1);
//       expect(postService.checkPostOwner).toBeCalledWith(mockUserDto, mockPostFindOne);
//       expect(postService.findPost).toBeCalledTimes(1);
//       expect(postService.findPost).toBeCalledWith({ postId: mockPostFindOne.id });
//     });

//     it('Post is not published and user is not post owner', async () => {
//       postService.findPost = jest.fn().mockResolvedValue(mockPostFindOne);
//       postEditedHistoryModelMock.findAndCountAll = jest
//         .fn()
//         .mockResolvedValue({ rows: [], count: 0 });
//       try {
//         await postService.getPostEditedHistory(
//           { id: mockUserDto.id + 100 },
//           mockPostFindOne.id,
//           mockGetPostEditedHistoryDto
//         );
//       } catch (e) {
//         console.log(e);
//       }
//       expect(postService.checkPostOwner).toBeCalledTimes(1);
//       expect(postService.findPost).toBeCalledTimes(1);
//       expect(postService.findPost).toBeCalledWith({ postId: mockPostFindOne.id });
//     });

//     it('All conditions are valid', async () => {
//       postService.findPost = jest.fn().mockResolvedValue(mockPostFindOne);
//       postEditedHistoryModelMock.findAndCountAll = jest.fn().mockResolvedValue({
//         rows: mockPostEditedHistoryFindAndCountAll,
//         count: mockPostEditedHistoryFindAndCountAll.length,
//       });
//       const result = await postService.getPostEditedHistory(
//         mockUserDto,
//         mockPostFindOne.id,
//         mockGetPostEditedHistoryDto
//       );
//       expect(result).toEqual(mockGetPostEditedHistoryResult);
//       expect(postService.checkPostOwner).toBeCalledTimes(1);
//       expect(postService.findPost).toBeCalledTimes(1);
//       expect(postService.findPost).toBeCalledWith({ postId: mockPostFindOne.id });
//     });
// });
});
