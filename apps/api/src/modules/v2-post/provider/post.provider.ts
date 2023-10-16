import {
  LIB_CONTENT_REPOSITORY_TOKEN,
  LIB_QUIZ_PARTICIPANT_REPOSITORY_TOKEN,
  LIB_QUIZ_REPOSITORY_TOKEN,
} from '@libs/database/postgres';
import { LibContentRepository } from '@libs/database/postgres/repository/content.repository';
import { LibQuizParticipantRepository } from '@libs/database/postgres/repository/quiz-participant.repository';
import { LibQuizRepository } from '@libs/database/postgres/repository/quiz.repository';

import { ContentBinding } from '../application/binding/binding-post/content.binding';
import { CONTENT_BINDING_TOKEN } from '../application/binding/binding-post/content.interface';
import {
  AutoSaveArticleHandler,
  CreateDraftArticleHandler,
  DeleteArticleHandler,
  ProcessArticleDeletedHandler,
  ProcessArticlePublishedHandler,
  ProcessArticleUpdatedHandler,
  PublishArticleHandler,
  ScheduleArticleHandler,
  UpdateArticleHandler,
} from '../application/command/article';
import {
  MarkReadImportantContentHandler,
  UpdateContentSettingHandler,
  ProcessScheduledContentPublishingHandler,
} from '../application/command/content';
import {
  AutoSavePostHandler,
  CreateDraftPostHandler,
  ProcessPostPublishedHandler,
  ProcessPostUpdatedHandler,
  PublishPostHandler,
  SchedulePostHandler,
  UpdatePostHandler,
} from '../application/command/post';
import {
  CreateSeriesHandler,
  DeleteSeriesHandler,
  ProcessSeriesDeletedHandler,
  ProcessSeriesPublishedHandler,
  ProcessSeriesUpdatedHandler,
  UpdateSeriesHandler,
} from '../application/command/series';
import { ValidateSeriesTagsHandler } from '../application/command/tag';
import { ContentCron } from '../application/cron';
import {
  ArticleDeletedEventHandler,
  ArticlePublishedEventHandler,
  ArticleUpdatedEventHandler,
} from '../application/event-handler/article';
import {
  PostPublishedEventHandler,
  PostScheduledEventHandler,
} from '../application/event-handler/post';
import {
  SeriesCreatedEventHandler,
  SeriesUpdatedEventHandler,
  SeriesDeletedEventHandler,
} from '../application/event-handler/series';
import { FindArticleHandler } from '../application/query/article';
import {
  FindDraftContentsHandler,
  FindNewsfeedHandler,
  GetSeriesInContentHandler,
  FindTimelineGroupHandler,
  GetMenuSettingsHandler,
  SearchContentsHandler,
} from '../application/query/content';
import { GetScheduleContentHandler } from '../application/query/content/get-schedule-content';
import { FindPostHandler, FindPostsByIdsHandler } from '../application/query/post';
import { FindItemsBySeriesHandler, FindSeriesHandler } from '../application/query/series';
import { SearchTagsHandler } from '../application/query/tag';
import { ArticleDomainService } from '../domain/domain-service/article.domain-service';
import { ContentDomainService } from '../domain/domain-service/content.domain-service';
import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  POST_DOMAIN_SERVICE_TOKEN,
  SERIES_DOMAIN_SERVICE_TOKEN,
} from '../domain/domain-service/interface';
import { PostDomainService } from '../domain/domain-service/post.domain-service';
import { SeriesDomainService } from '../domain/domain-service/series.domain-service';
import { PostFactory, ArticleFactory, SeriesFactory } from '../domain/factory';
import {
  ARTICLE_FACTORY_TOKEN,
  POST_FACTORY_TOKEN,
  SERIES_FACTORY_TOKEN,
} from '../domain/factory/interface';
import { CONTENT_REPOSITORY_TOKEN } from '../domain/repositoty-interface';
import { ArticleValidator } from '../domain/validator/article.validator';
import { ContentValidator } from '../domain/validator/content.validator';
import {
  CONTENT_VALIDATOR_TOKEN,
  ARTICLE_VALIDATOR_TOKEN,
  MENTION_VALIDATOR_TOKEN,
  POST_VALIDATOR_TOKEN,
} from '../domain/validator/interface';
import { MentionValidator } from '../domain/validator/mention.validator';
import { PostValidator } from '../domain/validator/post.validator';
import { ContentMapper } from '../driven-adapter/mapper/content.mapper';
import { QuizParticipantMapper } from '../driven-adapter/mapper/quiz-participant.mapper';
import { QuizQuestionMapper } from '../driven-adapter/mapper/quiz-question.mapper';
import { QuizMapper } from '../driven-adapter/mapper/quiz.mapper';
import { ContentRepository } from '../driven-adapter/repository/content.repository';
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
  SeriesCreatedEventHandler,
  SeriesUpdatedEventHandler,
  SeriesDeletedEventHandler,

  /** Application Binding */
  {
    provide: CONTENT_BINDING_TOKEN,
    useClass: ContentBinding,
  },

  /** Application Command */
  AutoSaveArticleHandler,
  CreateDraftArticleHandler,
  DeleteArticleHandler,
  ProcessArticleDeletedHandler,
  ProcessArticlePublishedHandler,
  ProcessArticleUpdatedHandler,
  ProcessScheduledContentPublishingHandler,
  PublishArticleHandler,
  ScheduleArticleHandler,
  UpdateArticleHandler,
  MarkReadImportantContentHandler,
  UpdateContentSettingHandler,
  AutoSavePostHandler,
  CreateDraftPostHandler,
  ProcessPostPublishedHandler,
  ProcessPostUpdatedHandler,
  PublishPostHandler,
  SchedulePostHandler,
  UpdatePostHandler,
  CreateSeriesHandler,
  DeleteSeriesHandler,
  ProcessSeriesDeletedHandler,
  ProcessSeriesPublishedHandler,
  ProcessSeriesUpdatedHandler,
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
  GetSeriesInContentHandler,

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

  /** Library Repository */
  {
    provide: LIB_CONTENT_REPOSITORY_TOKEN,
    useClass: LibContentRepository,
  },
  {
    provide: LIB_QUIZ_PARTICIPANT_REPOSITORY_TOKEN,
    useClass: LibQuizParticipantRepository,
  },
  {
    provide: LIB_QUIZ_REPOSITORY_TOKEN,
    useClass: LibQuizRepository,
  },
];
