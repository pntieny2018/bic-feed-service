import { ElasticsearchService } from '@nestjs/elasticsearch';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { Sequelize } from 'sequelize-typescript';
import { RedisModule } from '../../../../libs/redis/src';
import { SentryService } from '../../../../libs/sentry/src';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import { HTTP_STATUS_ID } from '../../../common/constants';
import { PostEditedHistoryMediaModel } from '../../../database/models/post-edited-history-media.model';
import { PostEditedHistoryModel } from '../../../database/models/post-edited-history.model';
import { PostGroupModel } from '../../../database/models/post-group.model';
import { PostModel } from '../../../database/models/post.model';
import { UserMarkReadPostModel } from '../../../database/models/user-mark-read-post.model';
import { GroupService } from '../../../shared/group';
import { UserService } from '../../../shared/user';
import { AuthorityService } from '../../authority';
import { CommentService } from '../../comment';
import { FeedService } from '../../feed/feed.service';
import { MediaService } from '../../media';
import { MentionService } from '../../mention';
import { DeleteReactionService } from '../../reaction/services';
import { PostPolicyService } from '../post-policy.service';
import { PostService } from '../post.service';
import {
  mockPostEditedHistoryFindAndCountAll,
  mockPostFindOne,
  mockUserDto,
} from './mocks/input.mock';
import { mockGetPostEditedHistoryDto } from './mocks/request/get-post-edited-history.dto.mock';
import { mockGetPostEditedHistoryResult } from './mocks/response/get-post-edited-history.response.mock';

describe('PostService', () => {
  let postService: PostService;
  let postModelMock;
  let postGroupModelMock;
  let userMarkedImportantPostModelMock;
  let sentryService: SentryService;
  let userService: UserService;
  let groupService: GroupService;
  let mediaService: MediaService;
  let mentionService: MentionService;
  let commentService: CommentService;
  let feedService: FeedService;
  let deleteReactionService: DeleteReactionService;
  let elasticSearchService: ElasticsearchService;
  let authorityService: AuthorityService;
  let transactionMock;
  let sequelize: Sequelize;
  let postEditedHistoryModelMock: typeof PostEditedHistoryModel;
  let postEditedHistoryMediaModelMock: typeof PostEditedHistoryMediaModel;

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
            isMemberOfGroups: jest.fn(),
          },
        },
        {
          provide: DeleteReactionService,
          useValue: {
            deleteReactionByPostIds: jest.fn(),
          },
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
          provide: getModelToken(PostEditedHistoryModel),
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
          provide: getModelToken(PostEditedHistoryMediaModel),
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
      ],
    }).compile();

    postService = moduleRef.get<PostService>(PostService);
    postModelMock = moduleRef.get<typeof PostModel>(getModelToken(PostModel));
    postGroupModelMock = moduleRef.get<typeof PostGroupModel>(getModelToken(PostGroupModel));
    postEditedHistoryModelMock = moduleRef.get<typeof PostEditedHistoryModel>(
      getModelToken(PostEditedHistoryModel)
    );
    postEditedHistoryMediaModelMock = moduleRef.get<typeof PostEditedHistoryMediaModel>(
      getModelToken(PostEditedHistoryMediaModel)
    );

    sentryService = moduleRef.get<SentryService>(SentryService);
    userService = moduleRef.get<UserService>(UserService);
    groupService = moduleRef.get<GroupService>(GroupService);
    mentionService = moduleRef.get<MentionService>(MentionService);
    mediaService = moduleRef.get<MediaService>(MediaService);
    commentService = moduleRef.get<CommentService>(CommentService);
    feedService = moduleRef.get<FeedService>(FeedService);
    deleteReactionService = moduleRef.get<DeleteReactionService>(DeleteReactionService);
    authorityService = moduleRef.get<AuthorityService>(AuthorityService);
    elasticSearchService = moduleRef.get<ElasticsearchService>(ElasticsearchService);
    sequelize = moduleRef.get<Sequelize>(Sequelize);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(postService).toBeDefined();
  });

  describe('getPostEditedHistory', () => {
    describe('User not in post groups', () => {
      it('Should failed', async () => {
        postService.findPost = jest.fn().mockResolvedValue(mockPostFindOne);
        authorityService.allowAccess = jest
          .fn()
          .mockRejectedValue(new Error(HTTP_STATUS_ID.API_FORBIDDEN));
        postEditedHistoryModelMock.findAndCountAll = jest
          .fn()
          .mockResolvedValue({ rows: [], count: 0 });
        try {
          await postService.getPostEditedHistory(
            mockUserDto,
            mockPostFindOne.id,
            mockGetPostEditedHistoryDto
          );
        } catch (e) {
          console.log(e);
        }
        expect(authorityService.allowAccess).toBeCalledTimes(1);
        expect(authorityService.allowAccess).toBeCalledWith(mockUserDto, mockPostFindOne);
        expect(postService.findPost).toBeCalledTimes(1);
        expect(postService.findPost).toBeCalledWith({ postId: mockPostFindOne.id });
      });
    });

    describe('Post is not published and user is not post owner', () => {
      it('Should failed', async () => {
        postService.findPost = jest.fn().mockResolvedValue(mockPostFindOne);
        authorityService.allowAccess = jest.fn().mockReturnValue('ok');
        postEditedHistoryModelMock.findAndCountAll = jest
          .fn()
          .mockResolvedValue({ rows: [], count: 0 });
        try {
          await postService.getPostEditedHistory(
            { id: mockUserDto.id + 100 },
            mockPostFindOne.id,
            mockGetPostEditedHistoryDto
          );
        } catch (e) {
          console.log(e);
        }
        expect(authorityService.allowAccess).toBeCalledTimes(1);
        expect(authorityService.allowAccess).toBeCalledWith(
          { id: mockUserDto.id + 100 },
          mockPostFindOne
        );
        expect(postService.findPost).toBeCalledTimes(1);
        expect(postService.findPost).toBeCalledWith({ postId: mockPostFindOne.id });
      });
    });

    describe('All conditions are valid', () => {
      it('Should successfully', async () => {
        postService.findPost = jest.fn().mockResolvedValue(mockPostFindOne);
        authorityService.allowAccess = jest.fn().mockReturnValue('ok');
        postEditedHistoryModelMock.findAndCountAll = jest.fn().mockResolvedValue({
          rows: mockPostEditedHistoryFindAndCountAll,
          count: mockPostEditedHistoryFindAndCountAll.length,
        });
        const result = await postService.getPostEditedHistory(
          mockUserDto,
          mockPostFindOne.id,
          mockGetPostEditedHistoryDto
        );
        expect(result).toEqual(mockGetPostEditedHistoryResult);
        expect(authorityService.allowAccess).toBeCalledTimes(1);
        expect(authorityService.allowAccess).toBeCalledWith(mockUserDto, mockPostFindOne);
        expect(postService.findPost).toBeCalledTimes(1);
        expect(postService.findPost).toBeCalledWith({ postId: mockPostFindOne.id });
      });
    });
  });
});
