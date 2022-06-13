import { Test, TestingModule } from '@nestjs/testing';
import { SentryService } from '@app/sentry';
import { ArticleListener } from '../article';
import { ArticleService } from '../../modules/article/article.service';
import { FeedPublisherService } from '../../modules/feed-publisher';
import { Sequelize } from 'sequelize-typescript';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { NotificationService } from '../../notification';
import { MediaService } from '../../modules/media';
import { FeedService } from '../../modules/feed/feed.service';
import { SeriesService } from '../../modules/series/series.service';
import {
  ArticleHasBeenDeletedEvent,
  ArticleHasBeenPublishedEvent,
  ArticleHasBeenUpdatedEvent,
} from '../../events/article';
import { ArticleVideoSuccessEvent } from '../../events/article/article-video-success.event';
import { ArticleVideoFailedEvent } from '../../events/article/article-video-failed.event';
import { mockPostResponseDto } from '../../notification/tests/mocks/input.mock';
import {
  mockedArticleData,
  mockedArticleResponse,
} from '../../modules/article/test/mocks/response/article.response.mock';
import { mockedArticleUpdated } from '../../modules/article/test/mocks/response/update-article.response.mock';
import { PostActivityService } from '../../notification/activities';
import { PostService } from '../../modules/post/post.service';
import { VideoProcessingEndDto } from '../../modules/post/dto/responses/process-video-response.dto';

describe('ArticleListener', () => {
  let articleListener;
  let postService;
  let articleService;
  let feedPublisherService;
  let sentryService;
  let elasticsearchService;
  let sequelize;
  let articleActivityService;
  let notificationService;
  let mediaService;
  let feedService;
  let seriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleListener,
        {
          provide: ElasticsearchService,
          useValue: {
            delete: jest.fn(),
            index: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: PostActivityService,
          useValue: {
            createPayload: jest.fn(),
          },
        },
        {
          provide: PostService,
          useValue: {
            deletePostEditedHistory: jest.fn(),
            processVideo: jest.fn(),
            savePostEditedHistory: jest.fn(),
            getPostsByMedia: jest.fn(),
            updatePostStatus: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            publishArticleNotification: jest.fn(),
          },
        },
        {
          provide: PostService,
          useValue: {
            deletePostEditedHistory: jest.fn(),
            processVideo: jest.fn(),
            savePostEditedHistory: jest.fn(),
            getPostsByMedia: jest.fn(),
            updatePostStatus: jest.fn(),
          },
        },
        {
          provide: ArticleService,
          useValue: {
            getArticlesByMedia: jest.fn(),
          },
        },
        {
          provide: FeedPublisherService,
          useValue: {
            attachArticlesForUsersNewsFeed: jest.fn(),
            fanoutOnWrite: jest.fn(),
          },
        },
        {
          provide: SentryService,
          useValue: {
            captureException: jest.fn(),
          },
        },
        {
          provide: MediaService,
          useValue: {
            updateData: jest.fn(),
          },
        },
        {
          provide: FeedService,
          useValue: {},
        },
        {
          provide: SeriesService,
          useValue: {
            updateTotalArticle: jest.fn(),
          },
        },
        {
          provide: Sequelize,
          useValue: {
            query: jest.fn(),
          },
        },
      ],
    }).compile();

    articleListener = module.get<ArticleListener>(ArticleListener);
    articleService = module.get<ArticleService>(ArticleService);
    elasticsearchService = module.get<ElasticsearchService>(ElasticsearchService);
    feedPublisherService = module.get<FeedPublisherService>(FeedPublisherService);
    notificationService = module.get<NotificationService>(NotificationService);
    postService = module.get<PostService>(PostService);
    sentryService = module.get<SentryService>(SentryService);
    mediaService = module.get<MediaService>(MediaService);
    feedService = module.get<FeedService>(FeedService);
    seriesService = module.get<SeriesService>(SeriesService);
    articleActivityService = module.get<PostActivityService>(PostActivityService)
  });

  describe('ArticleListener.onArticleDeleted', () => {
    const articleHasBeenDeletedEvent = new ArticleHasBeenDeletedEvent({
      actor: undefined,
      article: {
        totalUsersSeen: 0,
        canComment: false,
        canReact: false,
        canShare: false,
        commentsCount: 0,
        content: '',
        createdBy: 0,
        id: '',
        isArticle: false,
        isDraft: false,
        isImportant: false,
        updatedBy: 0,
        views: 0,
        groups: [{ postId: '1', groupId: 2 }],
        series: []
      },
    });
    it('should success', async () => {
      const loggerSpy = jest.spyOn(articleListener['_logger'], 'debug').mockReturnThis();
      seriesService.updateTotalArticle.mockResolvedValue()
      postService.deletePostEditedHistory.mockResolvedValue()
      elasticsearchService.delete.mockResolvedValue();
      await articleListener.onArticleDeleted(articleHasBeenDeletedEvent);
      expect(loggerSpy).toBeCalled();
      expect(postService.deletePostEditedHistory).toBeCalled();
      expect(elasticsearchService.delete).toBeCalled();
      expect(seriesService.updateTotalArticle).toBeCalled();
      expect( postService.deletePostEditedHistory).toBeCalled();
    });

    it('should continue even deletePostEditedHistory', async () => {
      const loggerSpy = jest.spyOn(articleListener['_logger'], 'error').mockReturnThis();
      postService.deletePostEditedHistory.mockRejectedValue();
      elasticsearchService.delete.mockRejectedValue();
      await articleListener.onArticleDeleted(articleHasBeenDeletedEvent);
      expect(loggerSpy).toBeCalled();
      expect(postService.deletePostEditedHistory).toBeCalled();
      expect(sentryService.captureException).toBeCalled();
    });

    it('should fail elasticsearchService.delete', async () => {
      seriesService.updateTotalArticle.mockResolvedValue()
      postService.deletePostEditedHistory.mockResolvedValue();
      elasticsearchService.delete.mockRejectedValue();
      await articleListener.onArticleDeleted(articleHasBeenDeletedEvent);
      expect(seriesService.updateTotalArticle).toBeCalled();
      expect(postService.deletePostEditedHistory).toBeCalled();
      expect(elasticsearchService.delete).toBeCalled();
      expect(sentryService.captureException).toBeCalled();
    });

  });

  describe('ArticleListener.onArticlePublished', () => {
    const articleHasBeenPublishedEvent = new ArticleHasBeenPublishedEvent({
      actor: undefined,
      article: mockedArticleResponse,
    });
    it('should success even processVideo and savePostEditedHistory and updateTotalArticle error', async () => {
      articleHasBeenPublishedEvent.payload.article.isDraft = false
      const loggerSpy = jest.spyOn(articleListener['_logger'], 'debug').mockReturnThis();
      postService.processVideo.mockRejectedValue(new Error('1'))
      postService.savePostEditedHistory.mockRejectedValue(new Error('2'))
      seriesService.updateTotalArticle.mockRejectedValue(new Error('3'))
      elasticsearchService.index.mockResolvedValue()
      feedPublisherService.fanoutOnWrite.mockResolvedValue()
      await articleListener.onArticlePublished(articleHasBeenPublishedEvent);
      expect(loggerSpy).toBeCalled();
      expect(postService.processVideo).toBeCalled();
      expect(postService.savePostEditedHistory).toBeCalled();
      expect(seriesService.updateTotalArticle).toBeCalled();
      expect(elasticsearchService.index).toBeCalled();
      expect(sentryService.captureException).toBeCalled();
    });
  });

  describe('ArticleListener.onArticleUpdated', () => {
    const newArticle = JSON.parse(JSON.stringify(mockedArticleResponse))
    newArticle.isDraft = false
    const articleHasBeenUpdatedEvent = new ArticleHasBeenUpdatedEvent({
      actor: undefined,
      oldArticle: mockedArticleResponse,
      newArticle: newArticle,
    });
    it('should success', async () => {
      const loggerSpy = jest.spyOn(articleListener['_logger'], 'debug').mockReturnThis();
      postService.processVideo.mockResolvedValue()
      postService.savePostEditedHistory.mockResolvedValue()
      elasticsearchService.update.mockResolvedValue()
      feedPublisherService.fanoutOnWrite.mockResolvedValue()

      await articleListener.onArticleUpdated(articleHasBeenUpdatedEvent);
      expect(postService.processVideo).toBeCalled();
      expect(postService.savePostEditedHistory).toBeCalled();
      expect(elasticsearchService.update).toBeCalled();
    });
  });

  describe('ArticleListener.onArticleVideoSuccess', () => {
    const articleVideoSuccessEvent = new ArticleVideoSuccessEvent(new VideoProcessingEndDto());
    articleVideoSuccessEvent.payload.properties = {}
    articleVideoSuccessEvent.payload.properties.name = '123'
    articleVideoSuccessEvent.payload.properties.size = 12
    articleVideoSuccessEvent.payload.properties.mimeType = '1212'
    articleVideoSuccessEvent.payload.properties.codec = '1212'
    it('should success', async () => {
      const loggerSpy = jest.spyOn(articleListener['_logger'], 'debug').mockReturnThis();
      mediaService.updateData.mockResolvedValue()
      articleService.getArticlesByMedia.mockResolvedValue([mockedArticleResponse])
      elasticsearchService.index.mockResolvedValue()
      seriesService.updateTotalArticle.mockResolvedValue()
      feedPublisherService.fanoutOnWrite.mockResolvedValue()
      await articleListener.onArticleVideoSuccess(articleVideoSuccessEvent);
      expect(loggerSpy).toBeCalled();
      expect(mediaService.updateData).toBeCalled();
      expect(articleService.getArticlesByMedia).toBeCalled();
      expect(elasticsearchService.index).toBeCalled();
      expect(seriesService.updateTotalArticle).toBeCalled();
      expect(feedPublisherService.fanoutOnWrite).toBeCalled();
    });
  });

  describe('ArticleListener.onArticleVideoFailed', () => {
    const articleVideoFailedEvent = new ArticleVideoFailedEvent(new VideoProcessingEndDto());
    articleVideoFailedEvent.payload.properties = {}
    articleVideoFailedEvent.payload.properties.name = '123'
    articleVideoFailedEvent.payload.properties.size = 12
    articleVideoFailedEvent.payload.properties.mimeType = '1212'
    articleVideoFailedEvent.payload.properties.codec = '1212'
    it('should success', async () => {
      const loggerSpy = jest.spyOn(articleListener['_logger'], 'debug').mockReturnThis();
      mediaService.updateData.mockResolvedValue()
      articleService.getArticlesByMedia.mockResolvedValue([mockedArticleResponse])
      postService.updatePostStatus.mockResolvedValue()
      await articleListener.onArticleVideoFailed(articleVideoFailedEvent);
      expect(loggerSpy).toBeCalled();
      expect(mediaService.updateData).toBeCalled();
      expect(articleService.getArticlesByMedia).toBeCalled();
      expect(postService.updatePostStatus).toBeCalled();
    });
  });
});
