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
import { mockedArticleResponse } from '../../modules/article/test/mocks/response/article.response.mock';
import { PostActivityService } from '../../notification/activities';
import { PostService } from '../../modules/post/post.service';
import { VideoProcessingEndDto } from '../../modules/post/dto/responses/process-video-response.dto';

describe.skip('ArticleListener', () => {
  let articleListener;
  let postService;
  let articleService;
  let feedPublisherService;
  let sentryService;
  let elasticsearchService;
  let mediaService;
  let feedService;
  let seriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleListener,
        ArticleService,
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
            saveEditedHistory: jest.fn(),
            getsByMedia: jest.fn(),
            updateStatus: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            publishArticleNotification: jest.fn(),
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
    postService = module.get<PostService>(PostService);
    sentryService = module.get<SentryService>(SentryService);
    mediaService = module.get<MediaService>(MediaService);
    feedService = module.get<FeedService>(FeedService);
    seriesService = module.get<SeriesService>(SeriesService);
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
        createdBy: '00000000-0000-0000-0000-000000000000',
        id: '',
        isArticle: false,
        isDraft: false,
        isImportant: false,
        updatedBy: '00000000-0000-0000-0000-000000000000',
        views: 0,
        groups: [
          {
            postId: 'b0d0287a-3ec9-4b9b-8032-2c491d954945',
            groupId: 'f39fe072-69d5-48f4-96a9-da54f00e73e0',
          },
        ],
        series: [],
      },
    });
    it('should success', async () => {
      const loggerSpy = jest.spyOn(articleListener['_logger'], 'debug').mockReturnThis();
      seriesService.updateTotalArticle.mockResolvedValue();
      postService.deletePostEditedHistory.mockResolvedValue();
      elasticsearchService.delete.mockResolvedValue();
      await articleListener.onArticleDeleted(articleHasBeenDeletedEvent);
      expect(loggerSpy).toBeCalled();
      expect(postService.deletePostEditedHistory).toBeCalled();
      expect(elasticsearchService.delete).toBeCalled();
      expect(seriesService.updateTotalArticle).toBeCalled();
      expect(postService.deletePostEditedHistory).toBeCalled();
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
      seriesService.updateTotalArticle.mockResolvedValue();
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
    it('should success even processVideo and saveEditedHistory and updateTotalArticle error', async () => {
      articleHasBeenPublishedEvent.payload.article.isDraft = false;
      const loggerSpy = jest.spyOn(articleListener['_logger'], 'debug').mockReturnThis();
      postService.processVideo.mockRejectedValue(new Error('b0d0287a-3ec9-4b9b-8032-2c491d954945'));
      postService.saveEditedHistory.mockRejectedValue(new Error('2'));
      seriesService.updateTotalArticle.mockRejectedValue(new Error('3'));
      elasticsearchService.index.mockResolvedValue();
      feedPublisherService.fanoutOnWrite.mockResolvedValue();
      await articleListener.onArticlePublished(articleHasBeenPublishedEvent);
      expect(loggerSpy).toBeCalled();
      expect(postService.processVideo).toBeCalled();
      expect(postService.saveEditedHistory).toBeCalled();
      expect(seriesService.updateTotalArticle).toBeCalled();
      expect(elasticsearchService.index).toBeCalled();
      expect(sentryService.captureException).toBeCalled();
    });
  });

  describe('ArticleListener.onArticleUpdated', () => {
    const newArticle = JSON.parse(JSON.stringify(mockedArticleResponse));
    newArticle.isDraft = false;
    const articleHasBeenUpdatedEvent = new ArticleHasBeenUpdatedEvent({
      actor: undefined,
      oldArticle: mockedArticleResponse,
      newArticle: newArticle,
    });
    it('should success', async () => {
      const loggerSpy = jest.spyOn(articleListener['_logger'], 'debug').mockReturnThis();
      postService.processVideo.mockResolvedValue();
      postService.saveEditedHistory.mockResolvedValue();
      elasticsearchService.index.mockResolvedValue();
      feedPublisherService.fanoutOnWrite.mockResolvedValue();

      await articleListener.onArticleUpdated(articleHasBeenUpdatedEvent);
      expect(postService.processVideo).toBeCalled();
      expect(postService.saveEditedHistory).toBeCalled();
      expect(elasticsearchService.index).toBeCalled();
    });
  });

  describe('ArticleListener.onArticleVideoSuccess', () => {
    const articleVideoSuccessEvent = new ArticleVideoSuccessEvent(new VideoProcessingEndDto());
    articleVideoSuccessEvent.payload.properties = {};
    articleVideoSuccessEvent.payload.properties.name = '123';
    articleVideoSuccessEvent.payload.properties.size = 12;
    articleVideoSuccessEvent.payload.properties.mimeType = '1212';
    articleVideoSuccessEvent.payload.properties.codec = '1212';
    it('should success', async () => {
      const loggerSpy = jest.spyOn(articleListener['_logger'], 'debug').mockReturnThis();
      mediaService.updateData.mockResolvedValue();
      articleService.getsByMedia.mockResolvedValue([mockedArticleResponse]);
      elasticsearchService.index.mockResolvedValue();
      seriesService.updateTotalArticle.mockResolvedValue();
      feedPublisherService.fanoutOnWrite.mockResolvedValue();
      await articleListener.onArticleVideoSuccess(articleVideoSuccessEvent);
      expect(loggerSpy).toBeCalled();
      expect(mediaService.updateData).toBeCalled();
      expect(articleService.getsByMedia).toBeCalled();
      expect(elasticsearchService.index).toBeCalled();
      expect(seriesService.updateTotalArticle).toBeCalled();
      expect(feedPublisherService.fanoutOnWrite).toBeCalled();
    });
  });

  describe('ArticleListener.onArticleVideoFailed', () => {
    const articleVideoFailedEvent = new ArticleVideoFailedEvent(new VideoProcessingEndDto());
    articleVideoFailedEvent.payload.properties = {};
    articleVideoFailedEvent.payload.properties.name = '123';
    articleVideoFailedEvent.payload.properties.size = 12;
    articleVideoFailedEvent.payload.properties.mimeType = '1212';
    articleVideoFailedEvent.payload.properties.codec = '1212';
    it('should success', async () => {
      const loggerSpy = jest.spyOn(articleListener['_logger'], 'debug').mockReturnThis();
      mediaService.updateData.mockResolvedValue();
      articleService.getsByMedia.mockResolvedValue([mockedArticleResponse]);
      articleService.updateStatus.mockResolvedValue();
      await articleListener.onArticleVideoFailed(articleVideoFailedEvent);
      expect(loggerSpy).toBeCalled();
      expect(mediaService.updateData).toBeCalled();
      expect(articleService.getsByMedia).toBeCalled();
      expect(articleService.updateStatus).toBeCalled();
    });
  });
});
