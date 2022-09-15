import { Test, TestingModule } from '@nestjs/testing';
import { PostModel, PostPrivacy } from '../../../database/models/post.model';
import { getModelToken } from '@nestjs/sequelize';
import { createMock } from '@golevelup/ts-jest';
import { SentryService } from '@app/sentry';
import { RedisModule } from '@app/redis';
import { UserService } from '../../../shared/user';
import { GroupService } from '../../../shared/group';
import { MediaService } from '../../media';
import { MentionService } from '../../mention';
import { Transaction } from 'sequelize';
import { CommentService } from '../../comment';
import { AuthorityService } from '../../authority';
import { Sequelize } from 'sequelize-typescript';
import { ReactionService } from '../../reaction';

import { ClientsModule } from '@nestjs/microservices';
import { ArticleService } from '../article.service';
import { mockedUserAuth } from './mocks/user-auth.mock';
import { PostService } from '../../post/post.service';
import { mockedArticleData, mockedArticleResponse } from './mocks/response/article.response.mock';
import { GetArticleDto, GetListArticlesDto, SearchArticlesDto } from '../dto/requests';
import { CategoryService } from '../../category/category.service';
import { SeriesService } from '../../series/series.service';
import { HashtagService } from '../../hashtag/hashtag.service';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { CategoryModel } from '../../../database/models/category.model';
import { SeriesModel } from '../../../database/models/series.model';
import { HashtagModel } from '../../../database/models/hashtag.model';
import { mockedPostResponse } from '../../post/test/mocks/response/post.response.mock';
import { PageDto } from '../../../common/dto';
import { LogicException } from '../../../common/exceptions';
import { mockedCreateArticleDto } from './mocks/request/create-article.dto.mock';
import { mockedArticleCreated } from './mocks/response/create-article.response.mock';
import { mockedUpdatePostDto } from '../../post/test/mocks/request/update-post.dto.mock';
import { MediaStatus, MediaType } from '../../../database/models/media.model';
import { mockedUpdateArticleDto } from './mocks/request/updated-article.dto.mock';
import { AuthorityFactory } from '../../authority/authority.factory';
import { PostBindingService } from '../../post/post-binding.service';
import { PostGroupModel } from '../../../database/models/post-group.model';
import { UserMarkReadPostModel } from '../../../database/models/user-mark-read-post.model';
import { FeedService } from '../../feed/feed.service';
import { PostEditedHistoryModel } from '../../../database/models/post-edited-history.model';
import { KAFKA_PRODUCER } from '../../../common/constants';
import { UserNewsFeedModel } from '../../../database/models/user-newsfeed.model';
import { UserSeenPostModel } from '../../../database/models/user-seen-post.model';

describe('ArticleService', () => {
  let articleService: ArticleService;
  let postService: PostService;
  let reactionService: ReactionService;
  let mentionService: MentionService;
  let commentService: CommentService;
  let userService: UserService;
  let mediaService: MediaService;
  let categoryService: CategoryService;
  let seriesService: SeriesService;
  let hashtagService: HashtagService;
  let postBindingService: PostBindingService;
  let postModelMock;
  let authorityService: AuthorityService;
  let transactionMock;
  let sequelize: Sequelize;
  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [RedisModule, ClientsModule],
      providers: [
        ArticleService,
        FeedService,
        AuthorityService,
        {
          provide: AuthorityFactory,
          useValue: {
            createForUser: jest.fn()
          },
        },
        {
          provide: CategoryService,
          useClass: jest.fn(),
        },
        {
          provide: SeriesService,
          useClass: jest.fn(),
        },
        {
          provide: HashtagService,
          useClass: jest.fn(),
        },
        {
          provide: ElasticsearchService,
          useClass: jest.fn(),
        },
        {
          provide: PostService,
          useValue: {
            deletePost: jest.fn(),
          },
        },
        {
          provide: PostBindingService,
          useValue: {
            deletePost: jest.fn(),
          },
        },
        {
          provide: ReactionService,
          useClass: jest.fn(),
        },
        {
          provide: MentionService,
          useClass: jest.fn(),
        },
        {
          provide: CommentService,
          useClass: jest.fn(),
        },
        {
          provide: UserService,
          useClass: jest.fn(),
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
          provide: getModelToken(CategoryModel),
          useClass: jest.fn(),
        },
        {
          provide: getModelToken(UserMarkReadPostModel),
          useClass: jest.fn(),
        },
        {
          provide: getModelToken(PostEditedHistoryModel),
          useClass: jest.fn(),
        },
        {
          provide: getModelToken(SeriesModel),
          useClass: jest.fn(),
        },
        {
          provide: getModelToken(HashtagModel),
          useClass: jest.fn(),
        },
        {
          provide: getModelToken(UserNewsFeedModel),
          useClass: jest.fn(),
        },
        {
          provide: getModelToken(UserSeenPostModel),
          useClass: jest.fn(),
        },
        {
          provide: KAFKA_PRODUCER,
          useClass: jest.fn(),
        },
      ],
    }).compile();

    articleService = moduleRef.get<ArticleService>(ArticleService);
    userService = moduleRef.get<UserService>(UserService);
    postService = moduleRef.get<PostService>(PostService);
    postBindingService = moduleRef.get<PostBindingService>(PostBindingService);
    reactionService = moduleRef.get<ReactionService>(ReactionService);
    mentionService = moduleRef.get<MentionService>(MentionService);
    commentService = moduleRef.get<CommentService>(CommentService);
    mediaService = moduleRef.get<MediaService>(MediaService);
    categoryService = moduleRef.get<CategoryService>(CategoryService);
    seriesService = moduleRef.get<SeriesService>(SeriesService);
    hashtagService = moduleRef.get<HashtagService>(HashtagService);
    postModelMock = moduleRef.get<typeof PostModel>(getModelToken(PostModel));
    authorityService = moduleRef.get<AuthorityService>(AuthorityService);
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
    expect(articleService).toBeDefined();
  });


  describe('get', () => {
    const getArticleDto: GetArticleDto = {
      commentLimit: 1,
      childCommentLimit: 1,
      withComment: true,
      categories: ['a'],
    };

    it('Should get article successfully', async () => {
      postModelMock.findOne = jest.fn().mockResolvedValue({
        ...mockedArticleResponse,
        toJSON: () => mockedArticleResponse,
      });
      PostModel.loadMarkReadPost = jest.fn().mockResolvedValue([])
      PostModel.loadLock = jest.fn().mockResolvedValue([])

      authorityService.checkCanReadArticle = jest.fn().mockResolvedValue(Promise.resolve());
      commentService.getComments = jest.fn().mockResolvedValue(mockedPostResponse.comments);
      reactionService.bindToPosts = jest.fn().mockResolvedValue(Promise.resolve());
      mentionService.bindMentionsToPosts = jest.fn().mockResolvedValue(Promise.resolve());
      postBindingService.bindActorToPost = jest.fn().mockResolvedValue(Promise.resolve());
      postBindingService.bindAudienceToPost = jest.fn().mockResolvedValue(Promise.resolve());

      const result = await articleService.get(
        mockedArticleData.id,
        mockedUserAuth,
        getArticleDto
      );

      expect(result.comments).toStrictEqual(mockedArticleResponse.comments);
      expect(postBindingService.bindActorToPost).toBeCalledTimes(1);
      expect(postBindingService.bindAudienceToPost).toBeCalledTimes(1);
      expect(reactionService.bindToPosts).toBeCalledTimes(1);
      expect(mentionService.bindMentionsToPosts).toBeCalledTimes(1);
    });

    it('Should catch exception if post not found', async () => {
      postModelMock.findOne = jest.fn();
      PostModel.loadMarkReadPost = jest.fn().mockResolvedValue([])
      PostModel.loadLock = jest.fn().mockResolvedValue([])

      try {
        const result = await articleService.get(
          mockedArticleData.id,
          mockedUserAuth,
          getArticleDto
        );
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
    });
  });

  describe('getPublic', () => {
    const getArticleDto: GetArticleDto = {
      commentLimit: 1,
      childCommentLimit: 1,
      withComment: true,
      categories: ['a'],
    };

    it('Should get public article successfully', async () => {
      postModelMock.findOne = jest.fn().mockResolvedValue({
        ...mockedArticleResponse,
        toJSON: () => mockedArticleResponse,
      });

      authorityService.checkIsPublicArticle = jest.fn().mockResolvedValue(Promise.resolve());
      commentService.getComments = jest.fn().mockResolvedValue(mockedPostResponse.comments);
      reactionService.bindToPosts = jest.fn().mockResolvedValue(Promise.resolve());
      mentionService.bindMentionsToPosts = jest.fn().mockResolvedValue(Promise.resolve());
      postBindingService.bindActorToPost = jest.fn().mockResolvedValue(Promise.resolve());
      postBindingService.bindAudienceToPost = jest.fn().mockResolvedValue(Promise.resolve());

      const result = await articleService.getPublic(mockedArticleData.id, getArticleDto);

      expect(result.comments).toStrictEqual(mockedArticleResponse.comments);
      expect(postBindingService.bindActorToPost).toBeCalledTimes(1);
      expect(postBindingService.bindAudienceToPost).toBeCalledTimes(1);
      expect(reactionService.bindToPosts).toBeCalledTimes(1);
      expect(mentionService.bindMentionsToPosts).toBeCalledTimes(1);
    });

    it('Should catch exception if post not found', async () => {
      postModelMock.findOne = jest.fn();
      try {
        const result = await articleService.getPublic(mockedArticleData.id, getArticleDto);
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
    });
  });

  describe.skip('create', () => {
    it('Create article successfully', async () => {
      authorityService.checkCanCreatePost = jest.fn().mockResolvedValue(Promise.resolve());

      mediaService.isValid = jest.fn().mockResolvedValue(Promise.resolve());
      categoryService.checkValidCategory = jest.fn().mockResolvedValue(Promise.resolve());
      categoryService.addToPost = jest.fn().mockResolvedValue(Promise.resolve());
      seriesService.checkValid = jest.fn().mockResolvedValue(Promise.resolve());
      seriesService.addToPost = jest.fn().mockResolvedValue(Promise.resolve());
      hashtagService.findOrCreateHashtags = jest.fn().mockResolvedValue(['hashtag1']);
      hashtagService.addToPost = jest.fn().mockResolvedValue(Promise.resolve());

      mediaService.sync = jest.fn().mockResolvedValue(Promise.resolve());
      mediaService.createIfNotExist = jest.fn().mockReturnThis();
      mentionService.create = jest.fn().mockResolvedValue(mockedCreateArticleDto.mentions);
      mentionService.checkValidMentions = jest.fn();

      articleService.addGroup = jest.fn().mockResolvedValue(Promise.resolve());
      articleService.getPrivacy = jest.fn().mockResolvedValue(PostPrivacy.PUBLIC);

      postModelMock.create = jest.fn().mockResolvedValue(mockedArticleCreated);

      await articleService.create(mockedUserAuth, mockedCreateArticleDto);

      expect(sequelize.transaction).toBeCalledTimes(1);
      expect(transactionMock.commit).toBeCalledTimes(1);
      expect(transactionMock.rollback).not.toBeCalled();
      expect(mediaService.sync).toBeCalledTimes(1);
      expect(mentionService.create).toBeCalledTimes(1);
      expect(articleService.addGroup).toBeCalledTimes(1);
      expect(postModelMock.create.mock.calls[0][0]).toStrictEqual({
        isDraft: true,
        isArticle: true,
        content: mockedCreateArticleDto.content,
        createdBy: mockedUserAuth.id,
        updatedBy: mockedUserAuth.id,
        isImportant: mockedCreateArticleDto.setting.isImportant,
        importantExpiredAt: mockedCreateArticleDto.setting.importantExpiredAt,
        canShare: mockedCreateArticleDto.setting.canShare,
        canComment: mockedCreateArticleDto.setting.canComment,
        canReact: mockedCreateArticleDto.setting.canReact,
        isProcessing: false,
        hashtagsJson: mockedCreateArticleDto.hashtags,
        title: mockedCreateArticleDto.title,
        summary: mockedCreateArticleDto.summary,
        privacy: PostPrivacy.PUBLIC,
        views: 0,
      });
    });

    it('Should rollback if have an exception when insert data into DB', async () => {
      authorityService.checkCanCreatePost = jest.fn().mockResolvedValue(Promise.resolve());

      mediaService.isValid = jest.fn().mockResolvedValue(Promise.resolve());
      categoryService.checkValidCategory = jest.fn().mockResolvedValue(Promise.resolve());
      articleService.getPrivacy = jest.fn().mockResolvedValue(Promise.resolve());
      seriesService.checkValid = jest.fn().mockResolvedValue(Promise.resolve());
      hashtagService.findOrCreateHashtags = jest.fn().mockResolvedValue([]);

      mentionService.create = jest.fn().mockResolvedValue(mockedCreateArticleDto.mentions);
      mentionService.checkValidMentions = jest.fn();

      postModelMock.create = jest
        .fn()
        .mockRejectedValue(new Error('Any error when insert data to DB'));

      try {
        await articleService.create(mockedUserAuth, mockedCreateArticleDto);
      } catch (error) {
        expect(sequelize.transaction).toBeCalledTimes(1);
        expect(transactionMock.commit).not.toBeCalled();
        expect(transactionMock.rollback).toBeCalledTimes(1);
      }
    });
  });

  describe('updateArticle', () => {
    it('Update article successfully', async () => {

      mediaService.sync = jest.fn().mockResolvedValue(Promise.resolve());

      mentionService.create = jest.fn().mockResolvedValue(Promise.resolve());
      mentionService.setMention = jest.fn().mockResolvedValue(Promise.resolve());

      articleService.getPrivacy = jest.fn().mockResolvedValue(PostPrivacy.PUBLIC);

      categoryService.updateToPost = jest.fn().mockResolvedValue(Promise.resolve());
      seriesService.updateToPost = jest.fn().mockResolvedValue(Promise.resolve());
      hashtagService.findOrCreateHashtags = jest.fn().mockResolvedValue([]);
      hashtagService.updateToPost = jest.fn().mockResolvedValue(Promise.resolve());

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
      postModelMock.update.mockResolvedValueOnce(mockedArticleCreated);

      postModelMock.update = jest.fn().mockResolvedValue(mockedArticleCreated);

      await articleService.update(
        mockedArticleResponse,
        mockedUserAuth,
        mockedUpdateArticleDto
      );

      expect(sequelize.transaction).toBeCalledTimes(1);
      expect(transactionMock.commit).toBeCalledTimes(1);
      expect(transactionMock.rollback).not.toBeCalled();
      expect(mediaService.sync).toBeCalledTimes(1);
      expect(mentionService.create).not.toBeCalled();
      expect(postModelMock.update.mock.calls[0][0]).toStrictEqual({
        content: mockedUpdateArticleDto.content,
        updatedBy: mockedUserAuth.id,
        isImportant: mockedCreateArticleDto.setting.isImportant,
        importantExpiredAt: mockedCreateArticleDto.setting.importantExpiredAt,
        canShare: mockedCreateArticleDto.setting.canShare,
        canComment: mockedCreateArticleDto.setting.canComment,
        canReact: mockedCreateArticleDto.setting.canReact,
        title: mockedUpdateArticleDto.title,
        summary: mockedUpdateArticleDto.summary,
        privacy: PostPrivacy.PUBLIC,
        hashtagsJson: [],
      });
    });

    it('Should rollback if have an exception when update data into DB', async () => {
      mediaService.sync = jest.fn().mockResolvedValue(Promise.resolve());

      mentionService.create = jest.fn().mockResolvedValue(Promise.resolve());

      postService.setGroupByPost = jest.fn().mockResolvedValue(Promise.resolve());
      articleService.getPrivacy = jest.fn().mockResolvedValue(PostPrivacy.PUBLIC);

      mediaService.createIfNotExist = jest.fn().mockResolvedValueOnce([
        {
          id: mockedUpdateArticleDto.media.images[0].id,
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
      postModelMock.update = jest
        .fn()
        .mockRejectedValue(new Error('Any error when insert data to DB'));

      try {
        await articleService.update(
          mockedArticleResponse,
          mockedUserAuth,
          mockedUpdateArticleDto
        );
      } catch (e) {
        expect(sequelize.transaction).toBeCalledTimes(1);
        expect(transactionMock.commit).not.toBeCalledTimes(1);
        expect(transactionMock.rollback).toBeCalledTimes(1);
      }
    });
  });

  describe('updateView', () => {
    it('Update view successfully', async () => {
      postModelMock.increment = jest.fn();
      await articleService.updateView(mockedArticleCreated.id, mockedUserAuth);
      const dataUpdate = { views: 1 };
      expect(postModelMock.increment).toBeCalledWith(dataUpdate, {
        where: {
          id: mockedArticleCreated.id,
          createdBy: mockedUserAuth.id,
        },
      });
    });

    it('Should catch exception if creator not found in cache', async () => {
      try {
        await articleService.updateView(mockedArticleCreated.id, {
          ...mockedUserAuth,
          profile: null,
        });
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
    });
  });

  describe.skip('getList', () => {
    it('Should get list article successfully', async () => {
      const getArticleListDto: GetListArticlesDto = {
        categories: ['0afb93ac-1234-4323-b7ef-5e809bf9b722'],
        offset: 0,
        limit: 1,
      };

      PostModel.getArticlesData = jest.fn().mockResolvedValue(Promise.resolve());
      userService.get = jest.fn().mockResolvedValue(mockedUserAuth);

      postBindingService.bindActorToPost = jest.fn();
      postBindingService.bindAudienceToPost = jest.fn();
      articleService.group = jest.fn().mockResolvedValue([]);
      articleService.maskArticleContent = jest.fn();
      reactionService.bindToPosts = jest.fn().mockResolvedValue(Promise.resolve());
      mentionService.bindMentionsToPosts = jest.fn().mockResolvedValue(Promise.resolve());

      const result = await articleService.getList(mockedUserAuth, getArticleListDto);

      expect(postBindingService.bindActorToPost).toBeCalledTimes(1);
      expect(postBindingService.bindAudienceToPost).toBeCalledTimes(1);
      expect(result).toBeInstanceOf(PageDto);
    });
  });
});
