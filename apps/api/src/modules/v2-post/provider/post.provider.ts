import { ContentBinding, CONTENT_BINDING_TOKEN } from '../application/binding';
import {
  AutoSaveArticleHandler,
  CreateDraftArticleHandler,
  DeleteArticleHandler,
  PublishArticleHandler,
  ScheduleArticleHandler,
  UpdateArticleHandler,
} from '../application/command/article';
import {
  MarkReadImportantContentHandler,
  PinContentHandler,
  ProcessScheduledContentPublishingHandler,
  ReorderPinnedContentHandler,
  SeenContentHandler,
  SaveContentHandler,
  UpdateContentSettingHandler,
  ProcessGroupPrivacyUpdatedHandler,
  UnsaveContentHandler,
} from '../application/command/content';
import { ProcessGroupStateUpdatedHandler } from '../application/command/content/process-group-state-updated';
import {
  AutoSavePostHandler,
  CreateDraftPostHandler,
  DeletePostHandler,
  PublishPostHandler,
  SchedulePostHandler,
  UpdatePostHandler,
  PostVideoProcessedHandler,
} from '../application/command/post';
import {
  AddSeriesItemsHandler,
  CreateSeriesHandler,
  DeleteSeriesHandler,
  RemoveSeriesItemsHandler,
  ReorderSeriesItemsHandler,
  UpdateSeriesHandler,
} from '../application/command/series';
import { ValidateSeriesTagsHandler } from '../application/command/tag';
import { ContentCron } from '../application/cron';
import {
  ArticleDeletedEventHandler,
  ArticlePublishedEventHandler,
  ArticleUpdatedEventHandler,
} from '../application/event-handler/article';
import { ContentHasSeenEventHandler } from '../application/event-handler/content';
import {
  PostDeletedEventHandler,
  PostPublishedEventHandler,
  PostScheduledEventHandler,
  PostUpdatedEventHandler,
} from '../application/event-handler/post';
import {
  FilePostDeletedEventHandler,
  FilePostPublishedEventHandler,
  FilePostUpdatedEventHandler,
} from '../application/event-handler/set-file-state';
import {
  VideoPostDeletedEventHandler,
  VideoPostUpdatedEventHandler,
  VideoPostVideoSuccessEventHandler,
} from '../application/event-handler/set-video-state';
import { FindArticleHandler } from '../application/query/article';
import {
  FindDraftContentsHandler,
  FindNewsfeedHandler,
  FindTimelineGroupHandler,
  GetMenuSettingsHandler,
  GetSeriesInContentHandler,
  GetTotalDraftHandler,
  SearchContentsHandler,
  FindPinnedContentHandler,
  GetContentAudienceHandler,
} from '../application/query/content';
import { GetScheduleContentHandler } from '../application/query/content/get-schedule-content';
import { FindPostHandler, FindPostsByIdsHandler } from '../application/query/post';
import {
  FindItemsBySeriesHandler,
  FindSeriesHandler,
  SearchContentsBySeriesHandler,
  SearchSeriesHandler,
} from '../application/query/series';
import { SearchTagsHandler } from '../application/query/tag';
import { ArticleDomainService } from '../domain/domain-service/article.domain-service';
import { ContentDomainService } from '../domain/domain-service/content.domain-service';
import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  CONTENT_DOMAIN_SERVICE_TOKEN,
  POST_DOMAIN_SERVICE_TOKEN,
  SERIES_DOMAIN_SERVICE_TOKEN,
} from '../domain/domain-service/interface';
import { NEWSFEED_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface/newsfeed.domain-service.interface';
import { NewsfeedDomainService } from '../domain/domain-service/newsfeed.domain-service';
import { PostDomainService } from '../domain/domain-service/post.domain-service';
import { SeriesDomainService } from '../domain/domain-service/series.domain-service';
import { ArticleFactory, PostFactory, SeriesFactory } from '../domain/factory';
import {
  ARTICLE_FACTORY_TOKEN,
  POST_FACTORY_TOKEN,
  SERIES_FACTORY_TOKEN,
} from '../domain/factory/interface';
import {
  CONTENT_REPOSITORY_TOKEN,
  POST_GROUP_REPOSITORY_TOKEN,
} from '../domain/repositoty-interface';
import { ArticleValidator } from '../domain/validator/article.validator';
import { ContentValidator } from '../domain/validator/content.validator';
import {
  ARTICLE_VALIDATOR_TOKEN,
  CONTENT_VALIDATOR_TOKEN,
  MENTION_VALIDATOR_TOKEN,
  POST_VALIDATOR_TOKEN,
} from '../domain/validator/interface';
import { MentionValidator } from '../domain/validator/mention.validator';
import { PostValidator } from '../domain/validator/post.validator';
import { ContentMapper } from '../driven-adapter/mapper/content.mapper';
import { QuizParticipantMapper } from '../driven-adapter/mapper/quiz-participant.mapper';
import { QuizQuestionMapper } from '../driven-adapter/mapper/quiz-question.mapper';
import { QuizMapper } from '../driven-adapter/mapper/quiz.mapper';
import { ContentRepository } from '../driven-adapter/repository';
import { PostGroupRepository } from '../driven-adapter/repository/post-group.repository';
import { ArticleProcessor } from '../driving-apdater/queue-processor/article.processor';

export const postProvider = [
  /** Processor */
  ArticleProcessor,

  /** Application Cron Handler */
  ContentCron,

  /** Application Event Handler */
  ArticleDeletedEventHandler,
  ArticlePublishedEventHandler,
  ArticleUpdatedEventHandler,

  PostPublishedEventHandler,
  PostScheduledEventHandler,
  PostDeletedEventHandler,
  PostUpdatedEventHandler,
  FilePostPublishedEventHandler,
  FilePostUpdatedEventHandler,
  FilePostDeletedEventHandler,
  VideoPostUpdatedEventHandler,
  VideoPostVideoSuccessEventHandler,
  VideoPostDeletedEventHandler,

  ContentHasSeenEventHandler,
  /** Application Binding */
  {
    provide: CONTENT_BINDING_TOKEN,
    useClass: ContentBinding,
  },

  /** Application Command */
  AutoSaveArticleHandler,
  CreateDraftArticleHandler,
  DeleteArticleHandler,
  PublishArticleHandler,
  ScheduleArticleHandler,
  UpdateArticleHandler,

  MarkReadImportantContentHandler,
  PinContentHandler,
  ProcessGroupPrivacyUpdatedHandler,
  ProcessGroupStateUpdatedHandler,
  ProcessScheduledContentPublishingHandler,
  ReorderPinnedContentHandler,
  SeenContentHandler,
  SaveContentHandler,
  UnsaveContentHandler,
  UpdateContentSettingHandler,

  AutoSavePostHandler,
  CreateDraftPostHandler,
  PublishPostHandler,
  SchedulePostHandler,
  UpdatePostHandler,
  DeletePostHandler,
  PostVideoProcessedHandler,

  CreateSeriesHandler,
  DeleteSeriesHandler,
  AddSeriesItemsHandler,
  RemoveSeriesItemsHandler,
  ReorderSeriesItemsHandler,
  UpdateSeriesHandler,
  ValidateSeriesTagsHandler,

  /** Application Query */
  FindArticleHandler,
  FindDraftContentsHandler,
  FindNewsfeedHandler,
  FindTimelineGroupHandler,
  GetMenuSettingsHandler,
  GetScheduleContentHandler,
  SearchContentsHandler,
  FindPostHandler,
  FindPostsByIdsHandler,
  FindItemsBySeriesHandler,
  FindSeriesHandler,
  SearchTagsHandler,
  GetTotalDraftHandler,
  GetSeriesInContentHandler,
  FindPinnedContentHandler,
  SearchSeriesHandler,
  GetContentAudienceHandler,
  SearchContentsBySeriesHandler,

  /** Domain Service */
  {
    provide: ARTICLE_DOMAIN_SERVICE_TOKEN,
    useClass: ArticleDomainService,
  },
  {
    provide: CONTENT_DOMAIN_SERVICE_TOKEN,
    useClass: ContentDomainService,
  },
  {
    provide: POST_DOMAIN_SERVICE_TOKEN,
    useClass: PostDomainService,
  },
  {
    provide: SERIES_DOMAIN_SERVICE_TOKEN,
    useClass: SeriesDomainService,
  },
  {
    provide: NEWSFEED_DOMAIN_SERVICE_TOKEN,
    useClass: NewsfeedDomainService,
  },

  /** Domain Factory */
  {
    provide: ARTICLE_FACTORY_TOKEN,
    useClass: ArticleFactory,
  },
  {
    provide: POST_FACTORY_TOKEN,
    useClass: PostFactory,
  },
  {
    provide: SERIES_FACTORY_TOKEN,
    useClass: SeriesFactory,
  },

  /** Domain Validator */
  {
    provide: ARTICLE_VALIDATOR_TOKEN,
    useClass: ArticleValidator,
  },
  {
    provide: CONTENT_VALIDATOR_TOKEN,
    useClass: ContentValidator,
  },
  {
    provide: MENTION_VALIDATOR_TOKEN,
    useClass: MentionValidator,
  },
  {
    provide: POST_VALIDATOR_TOKEN,
    useClass: PostValidator,
  },

  /** Driven Mapper */
  ContentMapper,
  QuizParticipantMapper,
  QuizQuestionMapper,
  QuizMapper,
  /** Driven Repository */
  {
    provide: CONTENT_REPOSITORY_TOKEN,
    useClass: ContentRepository,
  },
  {
    provide: POST_GROUP_REPOSITORY_TOKEN,
    useClass: PostGroupRepository,
  },
];
