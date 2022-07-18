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
import { ElasticsearchHelper } from '../../../common/helpers';
import { mockedSearchResponse } from '../../post/test/mocks/response/search.response.mock';
import { PageDto } from '../../../common/dto';
import { PostResponseDto } from '../../post/dto/responses';
import { mockedPostCreated } from '../../post/test/mocks/response/create-post.response.mock';
import { mockedCreatePostDto } from '../../post/test/mocks/request/create-post.dto.mock';
import { LogicException } from '../../../common/exceptions';
import { mockedCreateArticleDto } from './mocks/request/create-article.dto.mock';
import { mockedArticleCreated } from './mocks/response/create-article.response.mock';
import { mockMediaModelArray } from '../../post/test/mocks/input.mock';
import { mockedUpdatePostDto } from '../../post/test/mocks/request/update-post.dto.mock';
import { MediaStatus, MediaType } from '../../../database/models/media.model';
import { mockedUpdateArticleDto } from './mocks/request/updated-article.dto.mock';

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
  let elasticSearchService: ElasticsearchService;
  let postModelMock;
  let categoryModelMock;
  let seriesModelMock;
  let hashtagModelMock;
  let authorityService: AuthorityService;
  let transactionMock;
  let sequelize: Sequelize;
  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [RedisModule, ClientsModule],
      providers: [
        ArticleService,
        AuthorityService,
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
          provide: getModelToken(CategoryModel),
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
      ],
    }).compile();

    articleService = moduleRef.get<ArticleService>(ArticleService);
    userService = moduleRef.get<UserService>(UserService);
    postService = moduleRef.get<PostService>(PostService);
    reactionService = moduleRef.get<ReactionService>(ReactionService);
    mentionService = moduleRef.get<MentionService>(MentionService);
    commentService = moduleRef.get<CommentService>(CommentService);
    mediaService = moduleRef.get<MediaService>(MediaService);
    categoryService = moduleRef.get<CategoryService>(CategoryService);
    seriesService = moduleRef.get<SeriesService>(SeriesService);
    hashtagService = moduleRef.get<HashtagService>(HashtagService);
    elasticSearchService = moduleRef.get<ElasticsearchService>(ElasticsearchService);
    postModelMock = moduleRef.get<typeof PostModel>(getModelToken(PostModel));
    categoryModelMock = moduleRef.get<typeof CategoryModel>(getModelToken(CategoryModel));
    seriesModelMock = moduleRef.get<typeof SeriesModel>(getModelToken(SeriesModel));
    hashtagModelMock = moduleRef.get<typeof HashtagModel>(getModelToken(HashtagModel));
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

  describe('deleteArticle', () => {
    const mockedDataDeletePost = createMock<PostModel>(mockedArticleData);
    it('Should delete article successfully', async () => {
      jest.spyOn(postService, 'deletePost').mockResolvedValueOnce(mockedDataDeletePost);
      const result = await articleService.deleteArticle('abcd', mockedUserAuth);
      expect(result).toStrictEqual(mockedDataDeletePost);
    });
  });

  describe('getArticle', () => {
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

      authorityService.checkCanReadArticle = jest.fn().mockResolvedValue(Promise.resolve());
      commentService.getComments = jest.fn().mockResolvedValue(mockedPostResponse.comments);
      reactionService.bindReactionToPosts = jest.fn().mockResolvedValue(Promise.resolve());
      mentionService.bindMentionsToPosts = jest.fn().mockResolvedValue(Promise.resolve());
      postService.bindActorToPost = jest.fn().mockResolvedValue(Promise.resolve());
      postService.bindAudienceToPost = jest.fn().mockResolvedValue(Promise.resolve());

      const result = await articleService.getArticle(
        mockedArticleData.id,
        mockedUserAuth,
        getArticleDto
      );

      expect(result.comments).toStrictEqual(mockedArticleResponse.comments);
      expect(postService.bindActorToPost).toBeCalledTimes(1);
      expect(postService.bindAudienceToPost).toBeCalledTimes(1);
      expect(reactionService.bindReactionToPosts).toBeCalledTimes(1);
      expect(mentionService.bindMentionsToPosts).toBeCalledTimes(1);
    });

    it('Should catch exception if post not found', async () => {
      postModelMock.findOne = jest.fn();
      try {
        const result = await articleService.getArticle(
          mockedArticleData.id,
          mockedUserAuth,
          getArticleDto
        );
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
    });
  });

  describe('getPublicArticle', () => {
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
      reactionService.bindReactionToPosts = jest.fn().mockResolvedValue(Promise.resolve());
      mentionService.bindMentionsToPosts = jest.fn().mockResolvedValue(Promise.resolve());
      postService.bindActorToPost = jest.fn().mockResolvedValue(Promise.resolve());
      postService.bindAudienceToPost = jest.fn().mockResolvedValue(Promise.resolve());

      const result = await articleService.getPublicArticle(mockedArticleData.id, getArticleDto);

      expect(result.comments).toStrictEqual(mockedArticleResponse.comments);
      expect(postService.bindActorToPost).toBeCalledTimes(1);
      expect(postService.bindAudienceToPost).toBeCalledTimes(1);
      expect(reactionService.bindReactionToPosts).toBeCalledTimes(1);
      expect(mentionService.bindMentionsToPosts).toBeCalledTimes(1);
    });

    it('Should catch exception if post not found', async () => {
      postModelMock.findOne = jest.fn();
      try {
        const result = await articleService.getPublicArticle(mockedArticleData.id, getArticleDto);
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
    });
  });

  describe('getPayloadSearch', () => {
    it('Should return payload correctly with no content, actor, time', async () => {
      const searchDto: SearchArticlesDto = {
        offset: 0,
        limit: 1,
        categories: ['0afb93ac-1234-4323-b7ef-5e809bf9b722'],
        series: ['1bfb93ac-2322-4323-b7ef-5e809bf9b722'],
      };
      const expectedResult = {
        index: ElasticsearchHelper.ALIAS.ARTICLE.all.name,
        body: {
          query: {
            bool: {
              filter: [
                {
                  terms: {
                    'category.id': ['0afb93ac-1234-4323-b7ef-5e809bf9b722'],
                  },
                },
                {
                  terms: {
                    'series.id': ['1bfb93ac-2322-4323-b7ef-5e809bf9b722'],
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
      const result = await articleService.getPayloadSearch(searchDto, [1]);
      expect(result).toStrictEqual(expectedResult);
    });

    it('Should return payload correctly with actor', async () => {
      const searchDto: SearchArticlesDto = {
        offset: 0,
        limit: 1,
        actors: [1],
        categories: ['0afb93ac-1234-4323-b7ef-5e809bf9b722'],
        series: ['1bfb93ac-2322-4323-b7ef-5e809bf9b722'],
      };
      const expectedResult = {
        index: ElasticsearchHelper.ALIAS.ARTICLE.all.name,
        body: {
          query: {
            bool: {
              filter: [
                {
                  terms: {
                    'category.id': ['0afb93ac-1234-4323-b7ef-5e809bf9b722'],
                  },
                },
                {
                  terms: {
                    'series.id': ['1bfb93ac-2322-4323-b7ef-5e809bf9b722'],
                  },
                },
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
      const result = await articleService.getPayloadSearch(searchDto, [1]);
      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe('searchArticles', () => {
    it('Should search article successfully', async () => {
      const searchDto: SearchArticlesDto = {
        categories: ['0afb93ac-1234-4323-b7ef-5e809bf9b722'],
        offset: 0,
        limit: 1,
      };
      elasticSearchService.search = jest.fn().mockResolvedValue(mockedSearchResponse);
      const mockPosts = mockedSearchResponse.body.hits.hits.map((item) => {
        const source = item._source;
        source['id'] = parseInt(item._id);
       // source['highlight'] = item.highlight['content'][0];
        return source;
      });
      userService.get = jest.fn().mockResolvedValue(mockedUserAuth);
      articleService.getPayloadSearch = jest.fn();

      postService.bindActorToPost = jest.fn();
      postService.bindAudienceToPost = jest.fn();
      postService.bindPostData = jest.fn();

      const result = await articleService.searchArticle(mockedUserAuth, searchDto);

      expect(articleService.getPayloadSearch).toBeCalledTimes(1);
      expect(elasticSearchService.search).toBeCalledTimes(1);
      expect(articleService.getPayloadSearch).toBeCalledWith(
        searchDto,
        mockedUserAuth.profile.groups
      );

      expect(postService.bindActorToPost).toBeCalledTimes(1);
      expect(postService.bindActorToPost).toBeCalledWith(mockPosts);
      expect(postService.bindAudienceToPost).toBeCalledTimes(1);
      expect(postService.bindPostData).toBeCalledTimes(1);
      expect(postService.bindAudienceToPost).toBeCalledWith(mockPosts);
      expect(result).toBeInstanceOf(PageDto);

      expect(result.list[0]).toBeInstanceOf(PostResponseDto);
    });
    it('Should return []', async () => {
      const searchDto: SearchArticlesDto = {
        categories: ['0afb93ac-1234-4323-b7ef-5e809bf9b722'],
        offset: 0,
        limit: 1,
      };
      elasticSearchService.search = jest.fn().mockResolvedValue(mockedSearchResponse);
      const result = await articleService.searchArticle(
        { ...mockedUserAuth, profile: null },
        searchDto
      );
      expect(elasticSearchService.search).not.toBeCalled();
      expect(result).toBeInstanceOf(PageDto);

      expect(result.list).toStrictEqual([]);
    });
  });

  describe('createArticle', () => {
    it('Create article successfully', async () => {
      authorityService.checkCanCreatePost = jest.fn().mockResolvedValue(Promise.resolve());

      mediaService.checkValidMedia = jest.fn().mockResolvedValue(Promise.resolve());
      categoryService.checkValidCategory = jest.fn().mockResolvedValue(Promise.resolve());
      categoryService.addPostToCategories = jest.fn().mockResolvedValue(Promise.resolve());
      seriesService.checkValidSeries = jest.fn().mockResolvedValue(Promise.resolve());
      seriesService.addPostToSeries = jest.fn().mockResolvedValue(Promise.resolve());
      hashtagService.findOrCreateHashtags = jest.fn().mockResolvedValue(['hashtag1']);
      hashtagService.addPostToHashtags = jest.fn().mockResolvedValue(Promise.resolve());

      mediaService.sync = jest.fn().mockResolvedValue(Promise.resolve());
      mediaService.createIfNotExist = jest.fn().mockReturnThis();
      mentionService.create = jest.fn().mockResolvedValue(mockedCreateArticleDto.mentions);
      mentionService.checkValidMentions = jest.fn();

      postService.addPostGroup = jest.fn().mockResolvedValue(Promise.resolve());
      postService.getPrivacyPost = jest.fn().mockResolvedValue(PostPrivacy.PUBLIC);

      postModelMock.create = jest.fn().mockResolvedValue(mockedArticleCreated);

      await articleService.createArticle(mockedUserAuth, mockedCreateArticleDto);

      expect(sequelize.transaction).toBeCalledTimes(1);
      expect(transactionMock.commit).toBeCalledTimes(1);
      expect(transactionMock.rollback).not.toBeCalled();
      expect(mediaService.sync).toBeCalledTimes(1);
      expect(mentionService.create).toBeCalledTimes(1);
      expect(postService.addPostGroup).toBeCalledTimes(1);
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

      mediaService.checkValidMedia = jest.fn().mockResolvedValue(Promise.resolve());
      categoryService.checkValidCategory = jest.fn().mockResolvedValue(Promise.resolve());
      postService.getPrivacyPost = jest.fn().mockResolvedValue(Promise.resolve());
      seriesService.checkValidSeries = jest.fn().mockResolvedValue(Promise.resolve());
      hashtagService.findOrCreateHashtags = jest.fn().mockResolvedValue([]);

      mentionService.create = jest.fn().mockResolvedValue(mockedCreateArticleDto.mentions);
      mentionService.checkValidMentions = jest.fn();

      postModelMock.create = jest
        .fn()
        .mockRejectedValue(new Error('Any error when insert data to DB'));

      try {
        await articleService.createArticle(mockedUserAuth, mockedCreateArticleDto);
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

      postService.setGroupByPost = jest.fn().mockResolvedValue(Promise.resolve());
      postService.getPrivacyPost = jest.fn().mockResolvedValue(PostPrivacy.PUBLIC);

      categoryService.setCategoriesByPost = jest.fn().mockResolvedValue(Promise.resolve());
      seriesService.setSeriesByPost = jest.fn().mockResolvedValue(Promise.resolve());
      hashtagService.findOrCreateHashtags = jest.fn().mockResolvedValue([]);
      hashtagService.setHashtagsByPost = jest.fn().mockResolvedValue(Promise.resolve());

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
        },
      ]);
      postModelMock.update.mockResolvedValueOnce(mockedArticleCreated);

      postModelMock.update = jest.fn().mockResolvedValue(mockedArticleCreated);

      await articleService.updateArticle(
        mockedArticleResponse,
        mockedUserAuth,
        mockedUpdateArticleDto
      );

      expect(sequelize.transaction).toBeCalledTimes(1);
      expect(transactionMock.commit).toBeCalledTimes(1);
      expect(transactionMock.rollback).not.toBeCalled();
      expect(mediaService.sync).toBeCalledTimes(1);
      expect(mentionService.create).not.toBeCalled();
      expect(postService.setGroupByPost).toBeCalledTimes(1);
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
      postService.getPrivacyPost = jest.fn().mockResolvedValue(PostPrivacy.PUBLIC);

      mediaService.getMediaList = jest.fn().mockResolvedValue(mockMediaModelArray);
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
        await articleService.updateArticle(
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

  describe('getList', () => {
    it('Should get list article successfully', async () => {
      const getArticleListDto: GetListArticlesDto = {
        categories: ['0afb93ac-1234-4323-b7ef-5e809bf9b722'],
        offset: 0,
        limit: 1,
      };

      PostModel.getArticlesData = jest.fn().mockResolvedValue(Promise.resolve());
      userService.get = jest.fn().mockResolvedValue(mockedUserAuth);

      postService.bindActorToPost = jest.fn();
      postService.bindAudienceToPost = jest.fn();
      postService.groupPosts = jest.fn().mockResolvedValue([]);
      articleService.maskArticleContent = jest.fn();
      reactionService.bindReactionToPosts = jest.fn().mockResolvedValue(Promise.resolve());
      mentionService.bindMentionsToPosts = jest.fn().mockResolvedValue(Promise.resolve());

      const result = await articleService.getList(mockedUserAuth, getArticleListDto);

      expect(postService.bindActorToPost).toBeCalledTimes(1);
      expect(postService.bindAudienceToPost).toBeCalledTimes(1);
      expect(result).toBeInstanceOf(PageDto);
    });
  });
});
