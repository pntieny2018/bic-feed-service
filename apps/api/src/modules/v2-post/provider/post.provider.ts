import {
  DeleteCacheContentWhenAdminHidHandler,
  DeleteCacheContentWhenContentDeletedHandler,
  DeleteCacheContentWhenContentUpdatedHandler,
  DeleteCacheContentWhenSeriesUpdatedItemsHandler,
} from '@api/modules/v2-post/application/event-handler/cache/delete-cache';
import { DetachNewsfeedWhenReportCreatedEventHandler } from '@api/modules/v2-post/application/event-handler/update-newsfeed/report-created.event-handler';
import { DetachNewsfeedWhenReportHiddenEventHandler } from '@api/modules/v2-post/application/event-handler/update-newsfeed/report-hidden.event-handler';
import { CONTENT_CACHE_REPOSITORY_TOKEN } from '@api/modules/v2-post/domain/repositoty-interface/content-cache.repository.interface';

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
import {
  ArticleDeletedEventHandler,
  ArticlePublishedEventHandler,
  ArticleUpdatedEventHandler,
} from '../application/event-handler/article';
import { ReportHiddenEventHandler } from '../application/event-handler/content';
import {
  SeenContentWhenReactionCreatedEventHandler,
  SeenContentWhenGetDetailEventHandler,
} from '../application/event-handler/mark-seen-content';
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
} from '../application/event-handler/set-video-state';
import { FindArticleHandler, SearchArticlesHandler } from '../application/query/article';
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
  GetScheduleContentHandler,
  CountContentPerWeekHandler,
  GetWelcomeContentsHandler,
  UsersSeenContentHandler,
} from '../application/query/content';
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
  NEWSFEED_DOMAIN_SERVICE_TOKEN,
} from '../domain/domain-service/interface';
import { NewsfeedDomainService } from '../domain/domain-service/newsfeed.domain-service';
import { PostDomainService } from '../domain/domain-service/post.domain-service';
import { SeriesDomainService } from '../domain/domain-service/series.domain-service';
import {
  CONTENT_REPOSITORY_TOKEN,
  POST_GROUP_REPOSITORY_TOKEN,
  USER_SEEN_CONTENT_REPOSITORY_TOKEN,
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
import {
  ContentCacheRepository,
  ContentRepository,
  UserSeenContentRepository,
} from '../driven-adapter/repository';
import { PostGroupRepository } from '../driven-adapter/repository/post-group.repository';

export const postProvider = [
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
  VideoPostDeletedEventHandler,
  ReportHiddenEventHandler,

  /** Cache Content Event Handler */
  DeleteCacheContentWhenContentDeletedHandler,
  DeleteCacheContentWhenContentUpdatedHandler,
  DeleteCacheContentWhenSeriesUpdatedItemsHandler,
  DeleteCacheContentWhenAdminHidHandler,

  SeenContentWhenReactionCreatedEventHandler,
  SeenContentWhenGetDetailEventHandler,
  DetachNewsfeedWhenReportHiddenEventHandler,
  DetachNewsfeedWhenReportCreatedEventHandler,
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
  SearchArticlesHandler,
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
  GetWelcomeContentsHandler,
  UsersSeenContentHandler,

  CountContentPerWeekHandler,

  CountContentPerWeekHandler,

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
  {
    provide: CONTENT_CACHE_REPOSITORY_TOKEN,
    useClass: ContentCacheRepository,
  },
  {
    provide: USER_SEEN_CONTENT_REPOSITORY_TOKEN,
    useClass: UserSeenContentRepository,
  },
];
