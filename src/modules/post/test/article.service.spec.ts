import { PageDto } from '../../../common/dto/pagination/page.dto';
import { GetPostDto } from '../dto/requests/get-post.dto';
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
import { ArticleService } from '../article.service';
import { mockedCreateArticleDto } from './mocks/request/create-article.dto.mock';
jest.mock('../article.service');
describe('ArticleService', () => {
  let articleService: ArticleService;
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
  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [RedisModule, ClientsModule],
      providers: [
        PostService,
        ArticleService,
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
    articleService = moduleRef.get<ArticleService>(ArticleService);
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
    expect(articleService).toBeDefined();
  });

  describe('createArticle', () => {
    it('Create article successfully', async () => {
      // jest.spyOn(authorityService, 'checkCanCreatePost').mockReturnThis();
      // jest.spyOn(mediaService, 'checkValidMedia').mockReturnThis();
      // jest.spyOn(mediaService, 'sync').mockReturnThis();
      // jest.spyOn(mentionService, 'create').mockReturnThis();
      // jest.spyOn(articleService, 'addPostGroup').mockReturnThis();
      // postModelMock.create.mockResolvedValueOnce(mockedPostCreated)

      // await articleService.createArticle(mockedUserAuth, mockedCreateArticleDto);
      // expect(sequelize.transaction).toBeCalledTimes(1);
      // expect(transactionMock.commit).toBeCalledTimes(1);
      // expect(transactionMock.rollback).not.toBeCalled();
      // expect(mediaService.sync).toBeCalledTimes(1);
      // expect(mentionService.create).not.toBeCalled();
      // expect(articleService.addPostGroup).toBeCalledTimes(1);
      // expect(postModelMock.create.mock.calls[0][0]).toStrictEqual({ isDraft: true,
      //   content: mockedCreateArticleDto.content,
      //   createdBy: mockedUserAuth.id,
      //   updatedBy: mockedUserAuth.id,
      //   isImportant: mockedCreateArticleDto.setting.isImportant,
      //   importantExpiredAt: mockedCreateArticleDto.setting.importantExpiredAt,
      //   canShare: mockedCreateArticleDto.setting.canShare,
      //   canComment: mockedCreateArticleDto.setting.canComment,
      //   canReact: mockedCreateArticleDto.setting.canReact,
      //   isProcessing: false 
      // })
    });

  });
});
