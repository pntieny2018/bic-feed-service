import { Test, TestingModule } from '@nestjs/testing';
import { SentryService } from '@app/sentry';
import { PostListener } from '../post';
import { PostService } from '../../modules/post/post.service';
import { FeedPublisherService } from '../../modules/feed-publisher';
import { UserService } from '../../shared/user';
import { Sequelize } from 'sequelize-typescript';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { PostActivityService } from '../../notification/activities';
import { NotificationService } from '../../notification';
import { MediaService } from '../../modules/media';
import { FeedService } from '../../modules/feed/feed.service';
import { SeriesService } from '../../modules/series/series.service';
import {
  PostHasBeenDeletedEvent,
  PostHasBeenPublishedEvent,
  PostHasBeenUpdatedEvent,
} from '../../events/post';
import {
  PostHasBeenDeletedEventPayload,
  PostHasBeenPublishedEventPayload,
} from '../../events/post/payload';
import { mockPostResponseDto } from '../../notification/tests/mocks/input.mock';
import { PostVideoSuccessEvent } from '../../events/post/post-video-success.event';
import {
  ProcessVideoResponseDto,
  VideoProcessingEndDto,
} from '../../modules/post/dto/responses/process-video-response.dto';
import { PostVideoFailedEvent } from '../../events/post/post-video-failed.event';

describe('PostListener', () => {
  let postListener;
  let postService;
  let feedPublisherService;
  let sentryService;
  let elasticsearchService;
  let sequelize;
  let postActivityService;
  let notificationService;
  let mediaService;
  let feedService;
  let seriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostListener,
        {
          provide: ElasticsearchService,
          useValue: {
            delete: jest.fn(),
            index: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: FeedPublisherService,
          useValue: {},
        },
        {
          provide: PostActivityService,
          useValue: {
            createPayload: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            publishPostNotification: jest.fn(),
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
          provide: FeedPublisherService,
          useValue: {
            attachPostsForUsersNewsFeed: jest.fn(),
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
          useValue: {},
        },
        {
          provide: Sequelize,
          useValue: {
            query: jest.fn(),
          },
        },
      ],
    }).compile();

    postListener = module.get<PostListener>(PostListener);
    elasticsearchService = module.get<ElasticsearchService>(ElasticsearchService);
    feedPublisherService = module.get<FeedPublisherService>(FeedPublisherService);
    postActivityService = module.get<PostActivityService>(PostActivityService);
    notificationService = module.get<NotificationService>(NotificationService);
    postService = module.get<PostService>(PostService);
    sentryService = module.get<SentryService>(SentryService);
    mediaService = module.get<MediaService>(MediaService);
    feedService = module.get<FeedService>(FeedService);
    seriesService = module.get<SeriesService>(SeriesService);
  });

  describe('PostListener.onPostDeleted', () => {
    const postHasBeenDeletedEvent = new PostHasBeenDeletedEvent({
      actor: undefined,
      post: {
        canComment: false,
        canReact: false,
        canShare: false,
        commentsCount: 0,
        totalUsersSeen: 0,
        content: '',
        createdBy: 0,
        id: '',
        isArticle: false,
        isDraft: false,
        isImportant: false,
        updatedBy: 0,
        views: 0,
        groups: [{ postId: '1', groupId: 2 }],
      },
    });
    it('should success', async () => {
      const loggerSpy = jest.spyOn(postListener['_logger'], 'debug').mockReturnThis();
      postService.deletePostEditedHistory.mockResolvedValue();
      elasticsearchService.delete.mockResolvedValue();
      postActivityService.createPayload.mockResolvedValue();
      notificationService.publishPostNotification.mockResolvedValue();
      await postListener.onPostDeleted(postHasBeenDeletedEvent);
      expect(loggerSpy).toBeCalled();
      expect(postService.deletePostEditedHistory).toBeCalled();
      expect(elasticsearchService.delete).toBeCalled();
      expect(postActivityService.createPayload).toBeCalled();
      expect(notificationService.publishPostNotification).toBeCalled();
    });

    it('should fail deletePostEditedHistory', async () => {
      const loggerSpy = jest.spyOn(postListener['_logger'], 'error').mockReturnThis();
      postService.deletePostEditedHistory.mockRejectedValue();
      await postListener.onPostDeleted(postHasBeenDeletedEvent);
      expect(loggerSpy).toBeCalled();
      expect(postService.deletePostEditedHistory).toBeCalled();
      expect(sentryService.captureException).toBeCalled();
    });

    it('should fail elasticsearchService.delete', async () => {
      postService.deletePostEditedHistory.mockResolvedValue();
      elasticsearchService.delete.mockRejectedValue();
      await postListener.onPostDeleted(postHasBeenDeletedEvent);
      expect(postService.deletePostEditedHistory).toBeCalled();
      expect(elasticsearchService.delete).toBeCalled();
      expect(sentryService.captureException).toBeCalled();
    });

    it('should postActivityService.createPayload', async () => {
      postService.deletePostEditedHistory.mockResolvedValue();
      elasticsearchService.delete.mockResolvedValue();
      postActivityService.createPayload.mockRejectedValue();
      await postListener.onPostDeleted(postHasBeenDeletedEvent);
      expect(postService.deletePostEditedHistory).toBeCalled();
      expect(elasticsearchService.delete).toBeCalled();
      expect(postActivityService.createPayload).toBeCalled();
    });
  });

  describe('PostListener.onPostPublished', () => {
    const postHasBeenPublishedEvent = new PostHasBeenPublishedEvent({
      actor: undefined,
      post: mockPostResponseDto,
    });
    it('should success', async () => {
      const loggerSpy = jest.spyOn(postListener['_logger'], 'debug').mockReturnThis();
      postService.processVideo.mockResolvedValue();
      postActivityService.createPayload.mockReturnValue({ object: {} });
      postService.savePostEditedHistory.mockResolvedValue();
      elasticsearchService.index.mockResolvedValue();
      await postListener.onPostPublished(postHasBeenPublishedEvent);
      expect(loggerSpy).toBeCalled();
      expect(postActivityService.createPayload).toBeCalled();
      expect(postService.savePostEditedHistory).toBeCalled();
      expect(elasticsearchService.index).toBeCalled();
    });
    it('should success even if postService.savePostEditedHistory', async () => {
      const loggerSpy = jest.spyOn(postListener['_logger'], 'debug').mockReturnThis();
      postService.processVideo.mockResolvedValue();
      postActivityService.createPayload.mockReturnValue({ object: {} });
      postService.savePostEditedHistory.mockRejectedValue();
      elasticsearchService.index.mockResolvedValue();
      await postListener.onPostPublished(postHasBeenPublishedEvent);
      expect(loggerSpy).toBeCalled();
      expect(postActivityService.createPayload).toBeCalled();
      expect(postService.savePostEditedHistory).toBeCalled();
      expect(sentryService.captureException).toBeCalled();
      expect(elasticsearchService.index).toBeCalled();
    });
  });

  describe('PostListener.onPostUpdated', () => {
    const postHasBeenUpdatedEvent = new PostHasBeenUpdatedEvent({
      actor: undefined,
      oldPost: mockPostResponseDto,
      newPost: mockPostResponseDto,
    });
    it('should success', async () => {
      const loggerSpy = jest.spyOn(postListener['_logger'], 'debug').mockReturnThis();
      postService.processVideo.mockResolvedValue();
      postActivityService.createPayload.mockReturnValue({ object: {} });
      postService.savePostEditedHistory.mockResolvedValue();
      elasticsearchService.update.mockResolvedValue();
      await postListener.onPostUpdated(postHasBeenUpdatedEvent);
      expect(loggerSpy).toBeCalled();
      expect(postService.processVideo).toBeCalled();
      expect(postActivityService.createPayload).toBeCalled();
      expect(postService.savePostEditedHistory).toBeCalled();
      expect(elasticsearchService.update).toBeCalled();
    });
  });

  describe('PostListener.onPostVideoSuccess', () => {
    const postVideoSuccessEvent = new PostVideoSuccessEvent(new VideoProcessingEndDto());
    postVideoSuccessEvent.payload.properties = {}
    postVideoSuccessEvent.payload.properties.name = '123'
    postVideoSuccessEvent.payload.properties.size = 12
    postVideoSuccessEvent.payload.properties.mimeType = '1212'
    postVideoSuccessEvent.payload.properties.codec = '1212'
    it('should success', async () => {
      const loggerSpy = jest.spyOn(postListener['_logger'], 'debug').mockReturnThis();
      postService.getPostsByMedia.mockResolvedValue([
        { id: '6020620d-142d-4f63-89f0-b63d24d60916' },
        { id: 'f6843473-58dc-49c8-a5c9-58d0be4673c1' },
      ]);
      postService.updatePostStatus.mockResolvedValue();
      elasticsearchService.index.mockResolvedValue();

      await postListener.onPostVideoSuccess(postVideoSuccessEvent);
      expect(loggerSpy).toBeCalled();
      expect(postService.getPostsByMedia).toBeCalled();
      expect(postService.updatePostStatus).toBeCalled();
      expect(elasticsearchService.index).toBeCalled();
    });
  });

  describe('PostListener.onPostVideoFailed', () => {
    const postVideoFailedEvent = new PostVideoFailedEvent(new VideoProcessingEndDto());
    postVideoFailedEvent.payload.properties = {}
    postVideoFailedEvent.payload.properties.name = '123'
    postVideoFailedEvent.payload.properties.size = 12
    postVideoFailedEvent.payload.properties.mimeType = '1212'
    postVideoFailedEvent.payload.properties.codec = '1212'
    it('should success', async () => {
      const loggerSpy = jest.spyOn(postListener['_logger'], 'debug').mockReturnThis();
      postService.getPostsByMedia.mockResolvedValue([
        { id: '6020620d-142d-4f63-89f0-b63d24d60916' },
        { id: 'f6843473-58dc-49c8-a5c9-58d0be4673c1' },
      ]);
      postService.updatePostStatus.mockResolvedValue();

      await postListener.onPostVideoFailed(postVideoFailedEvent);
      expect(loggerSpy).toBeCalled();
      expect(postService.getPostsByMedia).toBeCalled();
      expect(postService.updatePostStatus).toBeCalled();
    });
  });
});
