import { RedisModule } from '@app/redis';
import { SentryService } from '@app/sentry';
import { createMock } from '@golevelup/ts-jest';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ClientKafka, ClientsModule } from '@nestjs/microservices';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { KAFKA_PRODUCER } from '../../../common/constants';
import { EntityIdDto } from '../../../common/dto';
import { PageDto } from '../../../common/dto/pagination/page.dto';
import { LogicException } from '../../../common/exceptions';
import { MediaStatus, MediaType } from '../../../database/models/media.model';
import { PostGroupModel } from '../../../database/models/post-group.model';
import { PostModel, PostPrivacy } from '../../../database/models/post.model';
import { UserMarkReadPostModel } from '../../../database/models/user-mark-read-post.model';
import { GroupService } from '../../../shared/group';
import { UserService } from '../../../shared/user';
import { AuthorityService } from '../../authority';
import { AuthorityFactory } from '../../authority/authority.factory';
import { CommentService } from '../../comment';
import { FeedService } from '../../feed/feed.service';
import { MediaService } from '../../media';
import { MentionService } from '../../mention';
import { ReactionService } from '../../reaction';
import { UpdatePostDto } from '../dto/requests';
import { GetDraftPostDto } from '../dto/requests/get-draft-posts.dto';
import { PostResponseDto } from '../dto/responses';
import { PostBindingService } from '../post-binding.service';
import { PostPolicyService } from '../post-policy.service';
import { PostService } from '../post.service';
import { GetPostDto } from './../dto/requests/get-post.dto';
import { mockedGroups } from './mocks/input.mock';
import { mockedCreatePostDto } from './mocks/request/create-post.dto.mock';
import { mockedUpdatePostDto } from './mocks/request/update-post.dto.mock';
import { mockedPostCreated } from './mocks/response/create-post.response.mock';
import { mockedPostData, mockedPostResponse } from './mocks/response/post.response.mock';
import { mockedUserAuth } from './mocks/user.mock';
import { LinkPreviewService } from '../../link-preview/link-preview.service';

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
  let authorityService: AuthorityService;
  let postBindingService: PostBindingService;
  let transactionMock;
  let clientKafka;
  let sequelize: Sequelize;
  let sentryService: SentryService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [RedisModule, ClientsModule],
      providers: [
        PostService,
        PostPolicyService,
        AuthorityService,
        {
          provide: AuthorityFactory,
          useValue: {
            createForUser: jest.fn(),
          },
        },
        {
          provide: ElasticsearchService,
          useClass: jest.fn(),
        },
        {
          provide: 'CaslAbility',
          useValue: {
            can: jest.fn(),
          },
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
          provide: PostBindingService,
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
          provide: LinkPreviewService,
          useValue: {
            upsert: jest.fn(),
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
            captureMessage: jest.fn(),
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
            loadMarkReadPost: jest.fn(),
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
    postBindingService = moduleRef.get<PostBindingService>(PostBindingService);
    reactionService = moduleRef.get<ReactionService>(ReactionService);
    authorityService = moduleRef.get<AuthorityService>(AuthorityService);
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
      mediaService.sync = jest.fn().mockResolvedValue(Promise.resolve());
      mediaService.createIfNotExist = jest.fn().mockReturnThis();
      mentionService.create = jest.fn().mockResolvedValue(Promise.resolve());

      postService.addGroup = jest.fn().mockResolvedValue(Promise.resolve());
      postService.getPrivacy = jest.fn().mockResolvedValueOnce(PostPrivacy.PUBLIC);
      postModelMock.create = jest.fn().mockResolvedValue(mockedPostCreated);

      await postService.create(mockedUserAuth, mockedCreatePostDto);

      expect(sequelize.transaction).toBeCalledTimes(1);
      expect(transactionMock.commit).toBeCalledTimes(1);
      expect(transactionMock.rollback).not.toBeCalled();
      expect(mediaService.sync).toBeCalledTimes(1);
      expect(mentionService.create).not.toBeCalled();
      expect(postService.addGroup).toBeCalledTimes(1);
      expect(postModelMock.create.mock.calls[0][0]).toStrictEqual({
        isDraft: true,
        isArticle: false,
        content: mockedCreatePostDto.content,
        createdBy: mockedUserAuth.id,
        updatedBy: mockedUserAuth.id,
        isImportant: mockedCreatePostDto.setting.isImportant,
        importantExpiredAt: mockedCreatePostDto.setting.importantExpiredAt,
        canShare: mockedCreatePostDto.setting.canShare,
        canComment: mockedCreatePostDto.setting.canComment,
        canReact: mockedCreatePostDto.setting.canReact,
        isProcessing: false,
        // privacy: PostPrivacy.PUBLIC,
        hashtagsJson: [],
      });
    });

    it('Should rollback if have an exception when insert data into DB', async () => {
      postService.getPrivacy = jest.fn().mockResolvedValue('public');
      postModelMock.create = jest
        .fn()
        .mockRejectedValue(new Error('Any error when insert data to DB'));

      try {
        await postService.create(mockedUserAuth, mockedCreatePostDto);
      } catch (error) {
        expect(transactionMock.commit).not.toBeCalled();
        expect(transactionMock.rollback).toBeCalledTimes(1);
      }
    });
  });

  describe('updatePost', () => {
    it('Update post successfully', async () => {
      mediaService.sync = jest.fn().mockResolvedValue(Promise.resolve());

      mentionService.create = jest.fn().mockResolvedValue(Promise.resolve());

      postService.setGroupByPost = jest.fn().mockResolvedValue(Promise.resolve());
      postService.getPrivacy = jest.fn().mockResolvedValueOnce(PostPrivacy.PUBLIC);
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
        },
      ]);
      postModelMock.update.mockResolvedValueOnce(mockedPostCreated);

      postModelMock.update = jest.fn().mockResolvedValue(mockedPostCreated);

      await postService.update(mockedPostResponse, mockedUserAuth, mockedUpdatePostDto);

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
        privacy: PostPrivacy.PUBLIC,
      });
    });

    it('Should rollback if have an exception when update data into DB', async () => {
      mediaService.sync = jest.fn().mockResolvedValue(Promise.resolve());

      mentionService.create = jest.fn().mockResolvedValue(Promise.resolve());

      postService.setGroupByPost = jest.fn().mockResolvedValue(Promise.resolve());
      postService.getPrivacy = jest.fn().mockResolvedValueOnce(PostPrivacy.PUBLIC);
      mediaService.createIfNotExist = jest.fn().mockResolvedValueOnce([
        {
          id: mockedUpdatePostDto.media.images[0].id,
          name: 'filename.jpg',
          originName: 'filename.jpg',
          size: 1000,
          url: 'http://googl.com',
          width: 100,
          type: MediaType.IMAGE,
          createdBy: mockedUserAuth.id,
          updatedBy: mockedUserAuth.id,
          height: 100,
          status: MediaStatus.COMPLETED,
        },
      ]);
      postModelMock.update = jest
        .fn()
        .mockRejectedValue(new Error('Any error when insert data to DB'));

      try {
        await postService.update(mockedPostResponse, mockedUserAuth, mockedUpdatePostDto);
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

      mediaService.countMediaByPost = jest
        .fn()
        .mockResolvedValueOnce('09c88080-a975-44e1-ae67-89f3d37e114f');
      authorityService.checkCanCreatePost = jest.fn().mockReturnThis();
      postModelMock.update = jest.fn().mockResolvedValue(mockedDataUpdatePost);
      postService.getPrivacy = jest.fn().mockResolvedValueOnce(PostPrivacy.PUBLIC);
      mockedUserAuth.id = mockedDataUpdatePost.createdBy;
      const result = await postService.publish(mockedDataUpdatePost.id, mockedUserAuth);
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

      mediaService.countMediaByPost = jest
        .fn()
        .mockResolvedValueOnce('09c88080-a975-44e1-ae67-89f3d37e114f');

      try {
        await postService.publish(mockedDataUpdatePost.id, mockedUserAuth);
      } catch (error) {
        expect(error).toBeInstanceOf(LogicException);
      }
    });

    it('Should catch NotFoundException if post not found', async () => {
      postModelMock.findByPk = jest.fn().mockResolvedValue(null);

      try {
        await postService.publish(mockedDataUpdatePost.id, mockedUserAuth);
      } catch (error) {
        expect(error).toBeInstanceOf(LogicException);
      }
    });

    it('Should catch ForbiddenException if user is not owner', async () => {
      postModelMock.findByPk = jest.fn().mockResolvedValue(mockedDataUpdatePost);
      mediaService.countMediaByPost = jest
        .fn()
        .mockResolvedValueOnce('09c88080-a975-44e1-ae67-89f3d37e114f');
      try {
        await postService.publish(mockedDataUpdatePost.id, mockedUserAuth);
      } catch (error) {
        expect(error).toBeInstanceOf(LogicException);
      }
    });
  });

  describe('deletePost', () => {
    const mockedDataDeletePost = createMock<PostModel>(mockedPostData);

    it('Delete post successfully', async () => {
      authorityService.checkCanDeletePost = jest.fn().mockReturnThis();
      mentionService.setMention = jest.fn().mockResolvedValue(Promise.resolve());

      postService.setGroupByPost = jest.fn().mockResolvedValue(Promise.resolve());

      mediaService.sync = jest.fn().mockResolvedValue(Promise.resolve());

      reactionService.deleteByPostIds = jest.fn().mockResolvedValue(Promise.resolve());

      commentService.deleteCommentsByPost = jest.fn().mockResolvedValue(Promise.resolve());

      feedService.deleteNewsFeedByPost = jest.fn().mockResolvedValue(Promise.resolve());
      feedService.deleteUserSeenByPost = jest.fn().mockResolvedValue(Promise.resolve());

      userMarkedImportantPostModelMock.destroy = jest.fn().mockResolvedValue(mockedDataDeletePost);

      postModelMock.findOne = jest.fn().mockResolvedValue(mockedDataDeletePost);

      await postService.delete(mockedDataDeletePost.id, mockedUserAuth);

      expect(postModelMock.destroy).toHaveBeenCalledTimes(1);
      expect(mentionService.setMention).toHaveBeenCalledTimes(1);
      expect(mediaService.sync).toHaveBeenCalledTimes(1);
      expect(feedService.deleteNewsFeedByPost).toHaveBeenCalledTimes(1);
      expect(postService.setGroupByPost).toHaveBeenCalledTimes(1);
      expect(reactionService.deleteByPostIds).toHaveBeenCalledTimes(1);
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
        await postService.delete(mockedDataDeletePost.id, mockedUserAuth);
      } catch (error) {
        expect(transactionMock.commit).not.toBeCalledTimes(1);
        expect(transactionMock.rollback).toBeCalledTimes(1);
      }
    });

    it('Should throw exception if user is not owner', async () => {
      postModelMock.findByPk = jest.fn().mockResolvedValueOnce(mockedDataDeletePost);
      mockedUserAuth.id = mockedDataDeletePost.createdBy + '09c88080-a975-44e1-ae67-89f3d37e114f';
      try {
        await postService.delete(mockedDataDeletePost.id, mockedUserAuth);
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
    });

    it('Should throw exception if post not exist', async () => {
      postModelMock.findOne = jest.fn().mockResolvedValueOnce(null);
      try {
        await postService.delete('ad70928e-cffd-44a9-9b27-19faa7210530', mockedUserAuth);
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
    });
  });

  describe('addGroup', () => {
    it('Return if parameter is empty', async () => {
      await postService.addGroup([], 'ad70928e-cffd-44a9-9b27-19faa7210530', transactionMock);
    });

    it('Return if parameter is empty', async () => {
      await postService.addGroup(
        ['09c88080-a975-44e1-ae67-89f3d37e114f', '69fa2be3-5d43-4edf-84d9-650ce6799b41'],
        'ad70928e-cffd-44a9-9b27-19faa7210530',
        transactionMock
      );
      expect(postGroupModelMock.bulkCreate).toBeCalledTimes(1);
    });
  });

  describe('setGroupByPost', () => {
    it('Should excute query', async () => {
      const currentGroupPost = [
        {
          postId: 'ad70928e-cffd-44a9-9b27-19faa7210530',
          groupId: '09c88080-a975-44e1-ae67-89f3d37e114f',
        },
        {
          postId: 'ad70928e-cffd-44a9-9b27-19faa7210530',
          groupId: '69fa2be3-5d43-4edf-84d9-650ce6799b41',
        },
      ];

      const mockData = {
        groupIds: ['09c88080-a975-44e1-ae67-89f3d37e114f', '2f43bde9-261e-4538-9a0b-bf5b29b025de'],
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
        groupId: ['69fa2be3-5d43-4edf-84d9-650ce6799b41'],
        postId: mockData.postId,
      });

      const createPostQuery: any = postGroupModelMock.bulkCreate.mock.calls[0][0];

      expect(createPostQuery).toStrictEqual([
        {
          groupId: '2f43bde9-261e-4538-9a0b-bf5b29b025de',
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
      await postService.findPost(entity);
      expect(postModelMock.findOne).toBeCalledTimes(1);
    });

    it('Catch exception', async () => {
      postModelMock.findOne.mockResolvedValueOnce(null);
      try {
        await postService.findPost(entity);
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
    });
  });

  describe.skip('getDraftPost', () => {
    const postData = mockedPostData;
    const getDraftPostsDto: GetDraftPostDto = {
      limit: 1,
      offset: 0,
    };

    it('Should get post successfully', async () => {
      const mockPosts = {
        rows: [
          {
            ...postData,
            toJSON: () => postData,
          },
        ],
        count: 1,
      };

      const total = [postData].length;
      postModelMock.findAndCountAll.mockResolvedValue(mockPosts);

      postBindingService.bindRelatedData = jest.fn();
      const result = await postService.getDrafts(mockedUserAuth.id, getDraftPostsDto);

      expect(postBindingService.bindRelatedData).toBeCalledTimes(1);
      expect(result).toBeInstanceOf(PageDto);
      expect(result.meta.total).toEqual(total);
      expect(result.list[0]).toBeInstanceOf(PostResponseDto);
    });
  });

  describe.skip('getPost', () => {
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
      PostModel.loadMarkReadPost = jest.fn().mockResolvedValue([]);

      authorityService.checkCanReadPost = jest.fn().mockResolvedValue(Promise.resolve());

      commentService.getComments = jest.fn().mockResolvedValue(null);

      postBindingService.bindRelatedData = jest.fn();

      const result = await postService.get(mockedPostData.id, mockedUserAuth, getPostDto);

      expect(result.comments).toStrictEqual(null);
      expect(postBindingService.bindRelatedData).toBeCalledTimes(1);
    });

    it('Post not found', async () => {
      postModelMock.findOne = jest.fn().mockResolvedValueOnce(null);
      PostModel.loadMarkReadPost = jest.fn().mockResolvedValue([]);
      try {
        await postService.get(mockedPostData.id, mockedUserAuth, getPostDto);
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
    });

    it('Catch ForbiddenException when access a post in invalid group', async () => {
      postModelMock.findOne = jest.fn().mockResolvedValueOnce({
        ...mockedPostResponse,
      });
      PostModel.loadMarkReadPost = jest.fn().mockResolvedValue([]);

      authorityService.checkCanReadPost = jest
        .fn()
        .mockRejectedValueOnce(
          new LogicException('You do not have permission to perform this action !')
        );

      try {
        await postService.get(mockedPostResponse.id, mockedUserAuth, getPostDto);
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
    });
  });

  describe.skip('bindActorToPost', () => {
    const posts = [{ createdBy: '09c88080-a975-44e1-ae67-89f3d37e114f', actor: null }];
    it('Should bind actor successfully', async () => {
      userService.getMany = jest.fn().mockResolvedValueOnce([
        {
          id: '09c88080-a975-44e1-ae67-89f3d37e114f',
        },
      ]);
      await postBindingService.bindActorToPost(posts);
      expect(posts[0].actor).toStrictEqual({ id: '09c88080-a975-44e1-ae67-89f3d37e114f' });
    });
  });

  describe.skip('bindPostData', () => {
    const posts = [{ id: '09c88080-a975-44e1-ae67-89f3d37e114f', commentsCount: 0 }];
    it('Should bind actor successfully', async () => {
      postModelMock.findAll.mockResolvedValueOnce(posts);
      await postBindingService.bindPostData(posts, ['commentsCount', 'totalUsersSeen']);
      expect(posts[0].commentsCount).toStrictEqual(posts[0].commentsCount);
    });
  });

  describe.skip('bindAudienceToPost', () => {
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
      await postBindingService.bindAudienceToPost(posts);
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

  describe('getPostsByMedia', () => {
    it('Should successfully', async () => {
      postModelMock.findAll = jest.fn().mockResolvedValue([{ toJSON: () => ({}) }]);

      postBindingService.bindRelatedData = jest.fn().mockResolvedValue(Promise.resolve());

      await postService.getsByMedia('d3c1fa78-de9b-4f40-ad97-ee4dc19e36d9');

      expect(postModelMock.findAll).toBeCalledTimes(1);
      expect(postBindingService.bindRelatedData).toBeCalledTimes(1);
    });
  });

  describe.skip('markReadPost', () => {
    it('Should successfully', async () => {});
  });

  describe.skip('findPostIdsByGroupId', () => {});

  describe('checkContent', () => {
    it('Should successfully', async () => {
      const updatePostDto: UpdatePostDto = {
        content: '',
        audience: {
          groupIds: ['09c88080-a975-44e1-ae67-89f3d37e114f'],
        },
        media: {
          images: [],
          files: [],
          videos: [],
        },
      };
      try {
        postService.checkContent(updatePostDto.content, updatePostDto.media);
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
    });
  });

  describe('updatePostStatus', () => {
    it('should success', async () => {
      await postService.updateStatus('09c88080-a975-44e1-ae67-89f3d37e114f');
      expect(sequelize.query).toBeCalled();
    });
  });

  describe('updatePostPrivacy', () => {
    it('should success', async () => {
      postModelMock.findOne = jest.fn().mockResolvedValueOnce({
        toJSON: () => ({
          id: '40dc4093-1bd0-4105-869f-8504e1986141',
          groups: [{ groupId: '09c88080-a975-44e1-ae67-89f3d37e114f' }],
        }),
      });
      groupService.getMany = jest.fn().mockResolvedValue([
        { id: '09c88080-a975-44e1-ae67-89f3d37e114f', privacy: PostPrivacy.SECRET },
        { id: '69fa2be3-5d43-4edf-84d9-650ce6799b41', privacy: PostPrivacy.PRIVATE },
      ]);

      await postService.updatePrivacy('40dc4093-1bd0-4105-869f-8504e1986141');
      expect(postModelMock.findOne).toBeCalled();
      expect(groupService.getMany).toBeCalled();
      expect(postModelMock.update).toBeCalled();
    });
  });

  describe('groupPosts', () => {
    it('should success', async () => {
      const groupResult = postService.group([mockedPostResponse]);
    });
  });

  describe('filterPostIdsNeedToUpdatePrivacy', () => {
    it('must follow rule privacy order', async () => {
      postGroupModelMock.findAll.mockResolvedValue([
        {
          groupId: '09c88080-a975-44e1-ae67-89f3d37e114f',
          postId: '09c88080-a975-44e1-ae67-89f3d37e114f',
        },
        {
          groupId: '69fa2be3-5d43-4edf-84d9-650ce6799b41',
          postId: '09c88080-a975-44e1-ae67-89f3d37e114f',
        },
      ]);
      groupService.getMany = jest.fn().mockResolvedValue([
        { id: '09c88080-a975-44e1-ae67-89f3d37e114f', privacy: PostPrivacy.SECRET },
        { id: '69fa2be3-5d43-4edf-84d9-650ce6799b41', privacy: PostPrivacy.PRIVATE },
      ]);

      const updatedPostIds = await postService.filterPostIdsNeedToUpdatePrivacy(
        [
          '09c88080-a975-44e1-ae67-89f3d37e114f',
          '69fa2be3-5d43-4edf-84d9-650ce6799b41',
          '2f43bde9-261e-4538-9a0b-bf5b29b025de',
          'b25a9ed3-5515-4958-85c1-7fbeda3928c5',
        ],
        PostPrivacy.SECRET
      );

      expect(updatedPostIds).toEqual({
        [PostPrivacy.PRIVATE.toString()]: ['09c88080-a975-44e1-ae67-89f3d37e114f'],
      });
    });
  });
});
