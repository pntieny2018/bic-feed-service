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
      postService.deletePostEditedHistory.mockResolvedValue();
      elasticsearchService.delete.mockResolvedValue();
      seriesService.updateTotalArticle.mockResolvedValue()
      postService.deletePostEditedHistory.mockResolvedValue()
      await articleListener.onArticleDeleted(articleHasBeenDeletedEvent);
      expect(loggerSpy).toBeCalled();
      expect(postService.deletePostEditedHistory).toBeCalled();
      expect(elasticsearchService.delete).toBeCalled();
      expect(seriesService.updateTotalArticle).toBeCalled();
      expect( postService.deletePostEditedHistory).toBeCalled();
    });

    it('should fail deletePostEditedHistory', async () => {
      const loggerSpy = jest.spyOn(articleListener['_logger'], 'error').mockReturnThis();
      postService.deletePostEditedHistory.mockRejectedValue();
      elasticsearchService.delete.mockRejectedValue()
      await articleListener.onArticleDeleted(articleHasBeenDeletedEvent);
      expect(loggerSpy).toBeCalled();
      expect(postService.deletePostEditedHistory).toBeCalled();
      expect(sentryService.captureException).toBeCalled();
    });

    it('should fail elasticsearchService.delete', async () => {
      postService.deletePostEditedHistory.mockResolvedValue();
      elasticsearchService.delete.mockRejectedValue();
      await articleListener.onArticleDeleted(articleHasBeenDeletedEvent);
      expect(postService.deletePostEditedHistory).toBeCalled();
      expect(elasticsearchService.delete).toBeCalled();
      expect(sentryService.captureException).toBeCalled();
    });

    it('should articleActivityService.createPayload', async () => {
      postService.deletePostEditedHistory.mockResolvedValue();
      elasticsearchService.delete.mockResolvedValue();
      await articleListener.onArticleDeleted(articleHasBeenDeletedEvent);
      expect(postService.deletePostEditedHistory).toBeCalled();
      expect(elasticsearchService.delete).toBeCalled();
    });
  });

  describe('ArticleListener.onArticlePublished', () => {
    const articleHasBeenPublishedEvent = new ArticleHasBeenPublishedEvent({
      actor: undefined,
      article: mockedArticleResponse,
    });
    it('should success', async () => {
      const loggerSpy = jest.spyOn(articleListener['_logger'], 'debug').mockReturnThis();
      postService.processVideo.mockResolvedValue();
      await articleListener.onArticlePublished(articleHasBeenPublishedEvent);
      expect(loggerSpy).toBeCalled();
    });
  });

  describe('ArticleListener.onArticleUpdated', () => {
    const articleHasBeenUpdatedEvent = new ArticleHasBeenUpdatedEvent({
      actor: undefined,
      oldArticle: mockedArticleResponse,
      newArticle: mockedArticleResponse,
    });
    it('should success', async () => {
      const loggerSpy = jest.spyOn(articleListener['_logger'], 'debug').mockReturnThis();
      await articleListener.onArticleUpdated(articleHasBeenUpdatedEvent);
      expect(loggerSpy).toBeCalled();
    });
  });

  describe('ArticleListener.onArticleVideoSuccess', () => {
    const articleVideoSuccessEvent = new ArticleVideoSuccessEvent(new VideoProcessingEndDto());
    it('should success', async () => {
      const loggerSpy = jest.spyOn(articleListener['_logger'], 'debug').mockReturnThis();
      postService.getPostsByMedia.mockResolvedValue([
        { id: '6020620d-142d-4f63-89f0-b63d24d60916' },
        { id: 'f6843473-58dc-49c8-a5c9-58d0be4673c1' },
      ]);
      postService.updatePostStatus.mockResolvedValue();
      elasticsearchService.index.mockResolvedValue();

      await articleListener.onArticleVideoSuccess(articleVideoSuccessEvent);
      expect(loggerSpy).toBeCalled();
      expect(postService.getPostsByMedia).toBeCalled();
      expect(postService.updatePostStatus).toBeCalled();
      expect(elasticsearchService.index).toBeCalled();
    });
  });

  describe('ArticleListener.onArticleVideoFailed', () => {
    const articleVideoFailedEvent = new ArticleVideoFailedEvent(new VideoProcessingEndDto());
    it('should success', async () => {
      const loggerSpy = jest.spyOn(articleListener['_logger'], 'debug').mockReturnThis();
      postService.getPostsByMedia.mockResolvedValue([
        { id: '6020620d-142d-4f63-89f0-b63d24d60916' },
        { id: 'f6843473-58dc-49c8-a5c9-58d0be4673c1' },
      ]);
      postService.updatePostStatus.mockResolvedValue();

      await articleListener.onArticleVideoFailed(articleVideoFailedEvent);
      expect(loggerSpy).toBeCalled();
      expect(postService.getPostsByMedia).toBeCalled();
      expect(postService.updatePostStatus).toBeCalled();
    });
  });
});
