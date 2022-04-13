import { PostResponseDto } from '../dto/responses/post.response.dto';
import { PageDto } from '../../../common/dto/pagination/page.dto';
import { GetPostDto } from './../dto/requests/get-post.dto';
import { mockedGroups } from './mocks/data/groups.mock';
import { MentionableType } from '../../../common/constants';
import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from '../post.service';
import { IPost, PostModel } from '../../../database/models/post.model';
import { getModelToken } from '@nestjs/sequelize';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { mockedPostList } from './mocks/data/post-list.mock';
import { mockedCreatePostDto } from './mocks/request/create-post.dto.mock';
import { mockedUpdatePostDto } from './mocks/request/update-post.mock';
import { mockedSearchResponse } from './mocks/response/search.response.mock';

import { mockedUserAuth, mockedUserAuthNullProfile, mockedUsers } from './mocks/data/user-auth.mock';
import { BadRequestException, ForbiddenException, forwardRef, HttpException, NotFoundException } from '@nestjs/common';
import { createMock } from '@golevelup/ts-jest';
import { SentryService } from '@app/sentry';
import { RedisModule } from '@app/redis';
import { UserService } from '../../../shared/user';
import { GroupService } from '../../../shared/group';
``;
import { Sequelize } from 'sequelize-typescript';
import { MediaService } from '../../media';
import { MentionService } from '../../mention';
import { Transaction } from 'sequelize';
import { PostGroupModel } from '../../../database/models/post-group.model';
import { EntityIdDto } from '../../../common/dto';
import { CommentModule, CommentService } from '../../comment';
import { AuthorityService } from '../../authority';
import { PostPolicyService } from '../post-policy.service';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import { mockedComments, mockedPostResponse } from './mocks/response/post.response.mock';
import { GetDraftPostDto } from '../dto/requests/get-draft-posts.dto';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { SearchPostsDto } from '../dto/requests';
import { ElasticsearchHelper } from '../../../common/helpers';
import { EntityType } from '../../media/media.constants';
import { DeleteReactionService } from '../../reaction/services';

describe('PostService', () => {
  let postService: PostService;
  let postModelMock;
  let postGroupModelMock;
  let sentryService: SentryService;
  let userService: UserService;
  let groupService: GroupService;
  let mediaService: MediaService;
  let mentionService: MentionService;
  let commentService: CommentService;
  let deleteReactionService: DeleteReactionService;
  let elasticSearchService: ElasticsearchService;
  let authorityService: AuthorityService;
  let transactionMock;
  let sequelize: Sequelize;
  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [RedisModule],
      providers: [
        PostService,
        PostPolicyService, 
        {
          provide: ElasticsearchService,
          useValue: {
            search: jest.fn(),
          },
        },
        {
          provide: AuthorityService,
          useValue: {
            allowAccess: jest.fn(),
          },
        },
        {
          provide: CommentService,
          useValue: {
            getComments: jest.fn(),
            deleteCommentsByPost: jest.fn()
          },
        },
        {
          provide: InternalEventEmitterService,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
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
            isMemberOfGroups: jest.fn()
          },
        },
        {
          provide: DeleteReactionService,
          useValue: {
            deleteReactionByPostIds: jest.fn()
          }
        },
        {
          provide: MediaService,
          useValue: {
            checkValidMedia: jest.fn(),
            countMediaByPost: jest.fn(),
          },
        },
        {
          provide: MentionService,
          useValue: {
            checkValidMentions: jest.fn(),
            bindMentionsToPosts: jest.fn(),
            setMention: jest.fn(),
          },
        },
        {
          provide: Sequelize,
          useValue: {
            transaction: jest.fn(),
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
            findAndCountAll: jest.fn()
          },
        },
        {
          provide: getModelToken(PostGroupModel),
          useValue: {
            bulkCreate: jest.fn(),
            findAll: jest.fn(),
            destroy: jest.fn()
          },
        },
      ],
    }).compile();

    postService = moduleRef.get<PostService>(PostService);
    postModelMock = moduleRef.get<typeof PostModel>(getModelToken(PostModel));
    postGroupModelMock = moduleRef.get<typeof PostGroupModel>(getModelToken(PostGroupModel));
    sentryService = moduleRef.get<SentryService>(SentryService);
    userService = moduleRef.get<UserService>(UserService);
    groupService = moduleRef.get<GroupService>(GroupService);
    mentionService = moduleRef.get<MentionService>(MentionService);
    mediaService = moduleRef.get<MediaService>(MediaService);
    commentService = moduleRef.get<CommentService>(CommentService);
    deleteReactionService = moduleRef.get<DeleteReactionService>(DeleteReactionService);
    authorityService = moduleRef.get<AuthorityService>(AuthorityService);
    elasticSearchService = moduleRef.get<ElasticsearchService>(ElasticsearchService);
    
    sequelize = moduleRef.get<Sequelize>(Sequelize); 

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
      const mockedDataCreatePost = createMock<PostModel>(mockedPostList[0]);
      const { files, videos, images } = mockedCreatePostDto.media;
      const {groupIds} = mockedCreatePostDto.audience;
      let mediaIds = [...new Set([...files, ...videos, ...images].map((i) => i.id))];

      groupService.isMemberOfGroups = jest.fn().mockResolvedValue(true);
      mediaService.checkValidMedia = jest.fn().mockResolvedValue(true);
      mentionService.checkValidMentions = jest.fn().mockResolvedValue(true);
      mentionService.create = jest.fn();
      postService.addPostGroup = jest.fn().mockResolvedValue(true);
      mediaService.activeMedia = jest.fn();

      postModelMock.create.mockResolvedValueOnce(mockedDataCreatePost);
      postGroupModelMock.bulkCreate.mockResolvedValueOnce(true);

      const result = await postService.createPost(mockedUserAuth, mockedCreatePostDto);
     
      expect(groupService.isMemberOfGroups).toBeCalledTimes(1);

      const mentionUserIds = mockedCreatePostDto.mentions.map((i) => i.id);
      expect(mentionService.checkValidMentions).toBeCalledWith(groupIds, mentionUserIds)
      expect(mediaService.checkValidMedia).toBeCalledTimes(1)

      expect(postModelMock.create).toHaveBeenCalledTimes(1);
      expect(mockedDataCreatePost.addMedia).toHaveBeenCalledWith(mediaIds);
      expect(sequelize.transaction).toBeCalledTimes(1);

      expect(mediaService.activeMedia).toBeCalledTimes(1)
      expect(mediaService.activeMedia).toBeCalledWith(mediaIds, mockedUserAuth.id)
      expect(mentionService.create).toBeCalledWith(mockedCreatePostDto.mentions.map((i) => ({
        entityId: mockedDataCreatePost.id,
        userId: i.id,
        mentionableType: MentionableType.POST,
      })))
      expect(postService.addPostGroup).toBeCalledTimes(1)
      expect(postService.addPostGroup).toHaveBeenCalledWith(groupIds, mockedDataCreatePost.id)
      expect(transactionMock.commit).toBeCalledTimes(1);

      const createPostQuery: any = postModelMock.create.mock.calls[0][0];

      //add Reaction
      expect(createPostQuery).toStrictEqual({
        content: mockedCreatePostDto.content,
        isDraft: mockedCreatePostDto.isDraft,
        createdBy: mockedUserAuth.id,
        updatedBy: mockedUserAuth.id,
        isImportant: mockedCreatePostDto.setting.isImportant,
        importantExpiredAt:
          mockedCreatePostDto.setting.isImportant === false
            ? null
            : mockedCreatePostDto.setting.importantExpiredAt,
        canShare: mockedCreatePostDto.setting.canShare,
        canComment: mockedCreatePostDto.setting.canComment,
        canReact: mockedCreatePostDto.setting.canReact,
      });
    });

    it('Should catch exception if creator not found in cache', async () => {
      userService.get = jest.fn().mockResolvedValue(null);

      try {
        const result = await postService.createPost(mockedUserAuth, mockedCreatePostDto);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
      }
    });

    it('Should catch exception if groups is invalid', async () => {
      userService.get = jest.fn().mockResolvedValue(mockedUserAuth);
      groupService.isMemberOfGroups = jest.fn().mockResolvedValue(false);
      try {
        const result = await postService.createPost(mockedUserAuth, mockedCreatePostDto);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
      }
    });

    it('Should rollback if have an exception when insert data into DB', async () => {
      userService.get = jest.fn().mockResolvedValue(true);
      groupService.isMemberOfGroups = jest.fn().mockResolvedValue(true);
      mediaService.checkValidMedia = jest.fn().mockResolvedValue(true);
      mediaService.activeMedia = jest.fn().mockResolvedValue(true);

      postModelMock.create.mockRejectedValue(new Error('Any error when insert data to DB'));

      try {
        const result = await postService.createPost(mockedUserAuth, mockedCreatePostDto);

        expect(sequelize.transaction).toBeCalledTimes(1);
        expect(transactionMock.commit).not.toBeCalled();
      } catch (error) {
        expect(transactionMock.rollback).toBeCalledTimes(1);
      }
    });
  });

  describe('updatePost', () => {
    const mockedDataUpdatePost = createMock<PostModel>(mockedPostList[0]);
    it('Update post successfully', async () => {
      const { files, videos, images } = mockedUpdatePostDto.media;
      let mediaIds = [...new Set([...files, ...videos, ...images].map((i) => i.id))];
      const { groupIds } = mockedUpdatePostDto.audience;
      const mentionUserIds = mockedUpdatePostDto.mentions.map((i) => i.id);
      postModelMock.findOne.mockResolvedValueOnce(mockedDataUpdatePost);
      groupService.isMemberOfGroups = jest.fn().mockResolvedValue(true);
      mediaService.checkValidMedia = jest.fn().mockResolvedValue(true); 
      mentionService.checkValidMentions = jest.fn().mockResolvedValue(true);
      postService.setGroupByPost = jest.fn().mockResolvedValue(true);
      mediaService.sync = jest.fn();

      postModelMock.update.mockResolvedValueOnce(mockedDataUpdatePost);
      postGroupModelMock.bulkCreate.mockResolvedValueOnce(true);

      const result = await postService.updatePost(mockedDataUpdatePost.id, mockedUserAuth, mockedUpdatePostDto);
      expect(result).toBe(true); 
     
      expect(groupService.isMemberOfGroups).toBeCalledTimes(1)
      expect(mentionService.checkValidMentions).toBeCalledWith(groupIds, mentionUserIds)
      expect(mediaService.checkValidMedia).toBeCalledTimes(1)
      
      expect(sequelize.transaction).toBeCalledTimes(1);

      expect(postModelMock.update).toHaveBeenCalledTimes(1);
      expect(mediaService.sync).toHaveBeenCalledWith(mockedDataUpdatePost.id, EntityType.POST, mediaIds);      
      expect(mentionService.setMention).toBeCalledWith(mentionUserIds, MentionableType.POST, mockedDataUpdatePost.id)

      expect(postService.setGroupByPost).toBeCalledTimes(1)
      expect(postService.setGroupByPost).toHaveBeenCalledWith(groupIds, mockedDataUpdatePost.id)
      expect(transactionMock.commit).toBeCalledTimes(1);

      const updatePostQuery: any = postModelMock.update.mock.calls[0][0];

      //add Reaction
      expect(updatePostQuery).toStrictEqual({
        content: mockedUpdatePostDto.content,
        updatedBy: mockedUserAuth.id,
        isImportant: mockedUpdatePostDto.setting.isImportant,
        importantExpiredAt:
          mockedUpdatePostDto.setting.isImportant === false
            ? null
            : mockedUpdatePostDto.setting.importantExpiredAt,
        canShare: mockedUpdatePostDto.setting.canShare,
        canComment: mockedUpdatePostDto.setting.canComment,
        canReact: mockedUpdatePostDto.setting.canReact,
      });
    }); 

    it('Should catch exception if creator not found in cache', async () => {
      try {
        await postService.updatePost(mockedDataUpdatePost.id, mockedUserAuthNullProfile, mockedUpdatePostDto);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
      }
    });

    it('Should catch exception if groups is invalid', async () => {
      groupService.isMemberOfGroups = jest.fn().mockResolvedValue(false);
      try {
        await postService.updatePost(mockedDataUpdatePost.id, mockedUserAuth, mockedUpdatePostDto);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
      }
    });

    it('Should rollback if have an exception when update data into DB', async () => {
      const mockedDataUpdatePost = createMock<PostModel>(mockedPostList[0]);
      groupService.isMemberOfGroups = jest.fn().mockResolvedValue(true);
      mediaService.checkValidMedia = jest.fn().mockResolvedValue(true);
      postModelMock.findOne.mockResolvedValueOnce(mockedDataUpdatePost);
      
      postModelMock.update.mockRejectedValue(new Error('Any error when insert data to DB'));

      try {
        await postService.updatePost(
          mockedDataUpdatePost.id,
          mockedUserAuth,
          mockedCreatePostDto
        );

        expect(sequelize.transaction).toBeCalledTimes(1);
        expect(transactionMock.commit).not.toBeCalled();
      } catch (error) {
        expect(transactionMock.rollback).toBeCalledTimes(1);
      }
    });
  });

  describe('publishPost', () => {
    const mockedDataUpdatePost = createMock<PostModel>(mockedPostList[0]);
    const authUserId = mockedDataUpdatePost.createdBy;
    it('Should return result successfully', async () => {
      postModelMock.findByPk.mockResolvedValueOnce(mockedDataUpdatePost);
      mediaService.countMediaByPost = jest.fn().mockResolvedValueOnce(1);
      postModelMock.update.mockResolvedValueOnce(mockedDataUpdatePost);
      
      const result = await postService.publishPost(mockedDataUpdatePost.id, authUserId);
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
      mockedDataUpdatePost.content = null;
      postModelMock.findByPk.mockResolvedValueOnce(mockedDataUpdatePost); 
      mediaService.countMediaByPost = jest.fn().mockResolvedValueOnce(1);
      try {
        await postService.publishPost(mockedDataUpdatePost.id, authUserId);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
      }
    });

    it('Should catch NotFoundException if post not found', async () => {
      
      postModelMock.findByPk.mockResolvedValueOnce(null);
      try {
        await postService.publishPost(mockedDataUpdatePost.id, authUserId);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });

    it('Should catch ForbiddenException if user is not owner', async () => {
      postModelMock.findByPk.mockResolvedValueOnce(mockedDataUpdatePost);
      mediaService.countMediaByPost = jest.fn().mockResolvedValueOnce(1);
      try {
        await postService.publishPost(mockedDataUpdatePost.id, authUserId);
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
      }
    });
  });

  describe('deletePost', () => {
    const mockedDataDeletePost = createMock<PostModel>(mockedPostList[0]);
    it('Delete post successfully', async () => {
      mentionService.resolveMentions = jest.fn().mockResolvedValueOnce(mockedUpdatePostDto.mentions);
      mediaService.sync = jest.fn();
      postService.setGroupByPost = jest.fn().mockResolvedValueOnce(true); 
      postModelMock.findOne.mockResolvedValueOnce(mockedDataDeletePost);

      postModelMock.destroy.mockResolvedValueOnce(mockedDataDeletePost);

      const result = await postService.deletePost(mockedDataDeletePost.id, mockedDataDeletePost.createdBy);
      expect(result).toStrictEqual(mockedDataDeletePost);
    
      expect(postModelMock.destroy).toHaveBeenCalledTimes(1);
      expect(mentionService.setMention).toHaveBeenCalledTimes(1);
      expect(mediaService.sync).toHaveBeenCalledTimes(1);
      expect(postService.setGroupByPost).toHaveBeenCalledTimes(1);
      expect(deleteReactionService.deleteReactionByPostIds).toHaveBeenCalledTimes(1);
      
      expect(commentService.deleteCommentsByPost).toHaveBeenCalledTimes(1);
      expect(commentService.deleteCommentsByPost).toHaveBeenCalledWith(mockedDataDeletePost.id);
      expect(transactionMock.commit).toBeCalledTimes(1);
      const [ condition ] = postModelMock.destroy.mock.calls[0];
      expect(condition.where).toStrictEqual({
        id: mockedDataDeletePost.id,
        createdBy: mockedDataDeletePost.createdBy,
      });
    });

    it('Should rollback if have exception', async () => {
      postModelMock.findOne.mockResolvedValueOnce(mockedDataDeletePost);
      postModelMock.destroy.mockRejectedValue(new Error('Any error when insert data to DB'));
      try {
        await postService.deletePost(mockedDataDeletePost.id, mockedUserAuth.id);
        expect(transactionMock.commit).not.toBeCalledTimes(1);
      } catch (error) {
        expect(transactionMock.rollback).toBeCalledTimes(1);
      }
    });

    it('Should throw exception if user is not owner', async () => {
      postModelMock.findOne.mockResolvedValueOnce(mockedDataDeletePost);
      try {
        await postService.deletePost(mockedDataDeletePost.id, mockedUserAuth.id + 1);
      } catch (e) {
        expect(e).toBeInstanceOf(ForbiddenException);
      }
    });

    it('Should throw exception if post not exist', async () => {
      postModelMock.findOne.mockResolvedValueOnce(null);
      try {
        await postService.deletePost(1, 1);
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException); 
      }
    });
  });

  describe('updateCommentCountByPost', () => {
    it('Should excute query', async () => {
      sequelize.query = jest.fn();
      await postService.updateCommentCountByPost(1); 
      expect(sequelize.query).toBeCalledTimes(1);
    });
  });

  describe('addPostGroup', () => {
    it('Return if parameter is empty', async () => {
      const result = await postService.addPostGroup([],1); 
      expect(result).toBe(true);
    });

    it('Return if parameter is empty', async () => {
      const result = await postService.addPostGroup([1,2],1); 
      expect(postGroupModelMock.bulkCreate).toBeCalledTimes(1);
      expect(result).toBe(true);
    });
  });

  describe('setGroupByPost', () => {
    it('Should excute query', async () => {
      const currentGroupPost = createMock<PostGroupModel[]>([
        {
          postId: 1,
          groupId: 1
        },
        {
          postId: 1,
          groupId: 2
        }
      ])
      const mockData = {
        groupIds: [1, 3],
        postId: 1
      }
      postGroupModelMock.findAll.mockResolvedValueOnce(currentGroupPost);
      const result = await postService.setGroupByPost(mockData.groupIds, mockData.postId); 
      expect(result).toBe(true);
      expect(postGroupModelMock.destroy).toBeCalledTimes(1);
      expect(postGroupModelMock.bulkCreate).toBeCalledTimes(1);

      const [ condition ] = postGroupModelMock.destroy.mock.calls[0];
      expect(condition.where).toStrictEqual({
        groupId: [2], 
        postId: mockData.postId,
      });

      const createPostQuery: any = postGroupModelMock.bulkCreate.mock.calls[0][0];

      expect(createPostQuery).toStrictEqual([
        {
          groupId: 3,
          postId: mockData.postId
        }
      ]);

    });
  });

  describe('findPost', () => {
    const entity: EntityIdDto = {
      postId: 1,
      commentId: 1,
      reactionCommentId: 1,
      reactionPostId: 1
    }
    it('Should get post successfully', async () => {
      const mockedPost = createMock<PostModel>(mockedPostList[0])
      postModelMock.findOne.mockResolvedValueOnce(mockedPost);
      const result = await postService.findPost(entity);
      expect(postModelMock.findOne).toBeCalledTimes(1);

    });

    it('Catch exception', async () => {
      postModelMock.findOne.mockResolvedValueOnce(null);
      try {
        const result = await postService.findPost(entity);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
      }
    });
  });

  describe('searchPosts', () => {
    
    it('Should search post successfully', async () => { 
      const searchDto: SearchPostsDto = {
        content: 'aaa',
        offset:0,
        limit:1
      }
      elasticSearchService.search = jest.fn().mockResolvedValue(mockedSearchResponse);
      const mockPosts  = mockedSearchResponse.body.hits.hits.map((item) => {
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
        offset:0,
        limit:1
      }
      elasticSearchService.search = jest.fn().mockResolvedValue(mockedSearchResponse);
      const result = await postService.searchPosts(mockedUserAuthNullProfile, searchDto);
      expect(elasticSearchService.search).not.toBeCalled();
      expect(result).toBeInstanceOf(PageDto);
  
      expect(result.list).toStrictEqual([]);
    });
  });
  describe('getPayloadSearch', () => {
    
    it('Should return payload correctly with no content, actor, time', async () => { 
      const searchDto: SearchPostsDto = {
        offset:0,
        limit:1
      }
      const expectedResult = {
        index: ElasticsearchHelper.INDEX.POST,
        body: {
          query: {
            bool: {
              filter: [
                {
                    terms: {
                    'audience.groups.id': [1]
                  }
                }
              ],
              must: [],
              should: []
            }
          },
          sort: [
            {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              _script: {
                type: 'number',
                script: {
                  lang: 'painless',
                  source:
                    "if (doc['setting.importantExpiredAt'].size() != 0 && doc['setting.importantExpiredAt'].value.millis > params['time']) return 1; else return 0",
                  params: {
                    time: Date.now(),
                  },
                },
                order: 'desc',
              },
            },
            { 'createdAt': 'desc' }
          ]
        },
        from: 0,
        size: 1,
      }
      const result = await postService.getPayloadSearch(searchDto, [1]);
      expect(result).toStrictEqual(expectedResult);
    });

    it('Should return payload correctly with actor', async () => { 
      const searchDto: SearchPostsDto = {
        offset:0,
        limit:1,
        actors: [1]
      }
      const expectedResult = {
        index: ElasticsearchHelper.INDEX.POST,
        body: {
          query: {
            bool: {
              filter: [
                {
                  terms: {
                    'actor.id': [1]
                  }
                },
                {
                  terms: {
                    'audience.groups.id': [1]
                  }
                }
              ],
              must: [],
              should: []
            }
          },
          sort: [
            {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              _script: {
                type: 'number',
                script: {
                  lang: 'painless',
                  source:
                    "if (doc['setting.importantExpiredAt'].size() != 0 && doc['setting.importantExpiredAt'].value.millis > params['time']) return 1; else return 0",
                  params: {
                    time: Date.now(),
                  },
                },
                order: 'desc',
              },
            },
            { 'createdAt': 'desc' }
          ]
        },
        from: 0,
        size: 1,
      }
      const result = await postService.getPayloadSearch(searchDto, [1]);
      expect(result).toStrictEqual(expectedResult);
    });

    it('Should return payload correctly with time', async () => { 
      const searchDto: SearchPostsDto = {
        offset:0,
        limit:1,
        startTime: '2022-03-23T17:00:00.000Z',
        endTime: '2022-03-25T17:00:00.000Z'
      }
      const expectedResult = {
        index: ElasticsearchHelper.INDEX.POST,
        body: {
          query: {
            bool: {
              must: [
                {
                  range: {
                      createdAt: {
                          gte: "2022-03-23T17:00:00.000Z",
                          lte: "2022-03-25T17:00:00.000Z"
                      }
                  }
                }
              ],
              filter: [
                {
                  terms: {
                    'audience.groups.id': [1]
                  }
                }
              ],
              should: []
            }
          },
          sort: [
            {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              _script: {
                type: 'number',
                script: {
                  lang: 'painless',
                  source:
                    "if (doc['setting.importantExpiredAt'].size() != 0 && doc['setting.importantExpiredAt'].value.millis > params['time']) return 1; else return 0",
                  params: {
                    time: Date.now(),
                  },
                },
                order: 'desc',
              },
            },
            { 'createdAt': 'desc' }
          ]
        },
        from: 0,
        size: 1,
      }
      const result = await postService.getPayloadSearch(searchDto, [1]);
      expect(result).toStrictEqual(expectedResult);
    });

    it('Should return payload correctly with content', async () => { 
      const searchDto: SearchPostsDto = {
        offset:0,
        limit:1,
        content: 'aaaa'
      }
      const expectedResult = {
        index: ElasticsearchHelper.INDEX.POST,
        body: {
          query: {
            bool: {
              must: [],
              filter: [
                {
                  terms: {
                    'audience.groups.id': [1]
                  }
                }
              ],
              should: [
                {
                  "dis_max": {
                      "queries": [
                          {
                              "match": {
                                  "content": "aaaa"
                              }
                          },
                          {
                              "match": {
                                  "content.ascii": {
                                      "query": "aaaa",
                                      "boost": 0.6
                                  }
                              }
                          },
                          {
                              "match": {
                                  "content.ngram": {
                                      "query": "aaaa",
                                      "boost": 0.3
                                  }
                              }
                          }
                      ]
                  }
              }
              ],
              "minimum_should_match": 1
            }
          },
          highlight: {
              "pre_tags": [
                  "=="
              ],
              "post_tags": [
                  "=="
              ],
              "fields": {
                  "content": {
                      "matched_fields": [
                          "content",
                          "content.ascii",
                          "content.ngram"
                      ],
                      "type": "fvh",
                      "number_of_fragments": 0
                  }
              }
          },
          sort: [
            {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              _script: {
                type: 'number',
                script: {
                  lang: 'painless',
                  source:
                    "if (doc['setting.importantExpiredAt'].size() != 0 && doc['setting.importantExpiredAt'].value.millis > params['time']) return 1; else return 0",
                  params: {
                    time: Date.now(),
                  },
                },
                order: 'desc',
              },
            },
            {"_score": "desc" },
            { 'createdAt': 'desc' }
          ]
        },
        from: 0,
        size: 1,
      }
      const result = await postService.getPayloadSearch(searchDto, [1]);
      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe('getDraftPost', () => {
    const postData = mockedPostList[0];
    const getDraftPostsDto: GetDraftPostDto = {
      limit: 1,
    }
    
    it('Should get post successfully', async () => {      
      const mockPosts = [
        { 
          ...postData,
          toJSON: () => postData,
        }
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
    const postData = mockedPostList[0];
    const getPostDto: GetPostDto = {
      commentLimit: 1,
      childCommentLimit: 1,
    }
    
    it('Should get post successfully', async () => {      
      postModelMock.findOne.mockResolvedValueOnce({
        ...postData,
        toJSON: () => postData,
      })
      commentService.getComments = jest.fn().mockResolvedValueOnce(mockedComments)
      postService.bindActorToPost = jest.fn();
      postService.bindAudienceToPost = jest.fn();
      const result = await postService.getPost(postData.id, mockedUserAuth, getPostDto);
      expect(result.comments).toStrictEqual(mockedComments);
      expect(postService.bindActorToPost).toBeCalledWith([postData]);
      expect(postService.bindAudienceToPost).toBeCalledWith([postData]);
    });
    it('Post not found', async () => {      
      postModelMock.findOne.mockResolvedValueOnce(null)
      try {
      await postService.getPost(postData.id, mockedUserAuth, getPostDto);
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException);
      }
    });

    it('Catch ForbiddenException when access a post in invalid group', async () => {      
      postModelMock.findOne.mockResolvedValueOnce({
        ...postData,
        toJSON: () => postData,
      });
      authorityService.allowAccess = jest.fn().mockRejectedValueOnce(new ForbiddenException('You do not have permission to perform this action !'))      
      try {
        await postService.getPost(postData.id, mockedUserAuth, getPostDto);
      } catch (e) {
        expect(e).toBeInstanceOf(ForbiddenException);
      }
    });
  });

  describe('bindActorToPost', () => {
    const posts = [{ createdBy: mockedUsers[0].id, actor: null }];
    it('Should bind actor successfully', async () => {
      userService.getMany = jest.fn().mockResolvedValueOnce(mockedUsers)
      await postService.bindActorToPost(posts);
      expect(posts[0].actor).toStrictEqual(mockedUsers[0]);
    });
  });

  describe('bindCommentsCount', () => {
    const posts = [{ id: mockedPostList[0].id, commentsCount: 0 }];
    it('Should bind actor successfully', async () => {
      postModelMock.findAll.mockResolvedValueOnce(posts)
      await postService.bindCommentsCount(posts);
      expect(posts[0].commentsCount).toStrictEqual(posts[0].commentsCount);
    });
  });

  describe('bindAudienceToPost', () => {
    const posts = [{
      audience: null,
      groups: [
        {
          id: mockedGroups[0].id
        }
      ] 
    }];
    it('Should bind audience successfully', async () => {
      groupService.getMany = jest.fn().mockResolvedValueOnce(mockedGroups)
      await postService.bindAudienceToPost(posts);
      expect(posts[0].audience.groups).toStrictEqual([mockedGroups[0]]);
    });
  });
});
