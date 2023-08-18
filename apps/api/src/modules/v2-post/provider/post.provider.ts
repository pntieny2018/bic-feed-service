import { ContentBinding } from '../application/binding/binding-post/content.binding';
import { CONTENT_BINDING_TOKEN } from '../application/binding/binding-post/content.interface';
import {
  AutoSaveArticleHandler,
  CreateDraftArticleHandler,
  DeleteArticleHandler,
  ProcessArticleDeletedHandler,
  ProcessArticlePublishedHandler,
  ProcessArticleScheduledHandler,
  ProcessArticleUpdatedHandler,
  PublishArticleHandler,
  ScheduleArticleHandler,
  UpdateArticleHandler,
} from '../application/command/article';
import {
  MarkReadImportantContentHandler,
  UpdateContentSettingHandler,
} from '../application/command/content';
import {
  AutoSavePostHandler,
  CreateDraftPostHandler,
  ProcessPostPublishedHandler,
  ProcessPostUpdatedHandler,
  PublishPostHandler,
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
import { ArticleDeletedEventHandler } from '../application/event-handler/article/article-deleted.event-handler';
import { ArticlePublishedEventHandler } from '../application/event-handler/article/article-publish.event-handler';
import { ArticleUpdatedEventHandler } from '../application/event-handler/article/article-updated.event-handler';
import {
  SeriesCreatedEventHandler,
  SeriesUpdatedEventHandler,
  SeriesDeletedEventHandler,
} from '../application/event-handler/series';
import { FindArticleHandler } from '../application/query/find-article/find-article.handler';
import { FindDraftContentsHandler } from '../application/query/find-draft-contents/find-draft-contents.handler';
import { FindItemsBySeriesHandler } from '../application/query/find-items-by-series/find-items-by-series.handler';
import { FindNewsfeedHandler } from '../application/query/find-newsfeed/find-newsfeed.handler';
import { FindPostHandler } from '../application/query/find-post/find-post.handler';
import { FindPostsByIdsHandler } from '../application/query/find-posts-by-ids/find-posts-by-ids.handler';
import { FindSeriesHandler } from '../application/query/find-series/find-series.handler';
import { FindTimelineGroupHandler } from '../application/query/find-timeline-group/find-timeline-group.handler';
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
  ARTICLE_VALIDATOR_TOKEN,
  CONTENT_VALIDATOR_TOKEN,
  MENTION_VALIDATOR_TOKEN,
  POST_VALIDATOR_TOKEN,
} from '../domain/validator/interface';
import { MentionValidator } from '../domain/validator/mention.validator';
import { PostValidator } from '../domain/validator/post.validator';
import { ContentRepository } from '../driven-adapter/repository/content.repository';
import { ArticleCron } from '../driving-apdater/cron/article.cron';

export const postProvider = [
  {
    provide: CONTENT_VALIDATOR_TOKEN,
    useClass: ContentValidator,
  },
  {
    provide: POST_VALIDATOR_TOKEN,
    useClass: PostValidator,
  },
  {
    provide: ARTICLE_VALIDATOR_TOKEN,
    useClass: ArticleValidator,
  },
  {
    provide: POST_FACTORY_TOKEN,
    useClass: PostFactory,
  },
  {
    provide: ARTICLE_FACTORY_TOKEN,
    useClass: ArticleFactory,
  },
  {
    provide: SERIES_FACTORY_TOKEN,
    useClass: SeriesFactory,
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
    provide: ARTICLE_DOMAIN_SERVICE_TOKEN,
    useClass: ArticleDomainService,
  },
  {
    provide: CONTENT_REPOSITORY_TOKEN,
    useClass: ContentRepository,
  },
  {
    provide: CONTENT_BINDING_TOKEN,
    useClass: ContentBinding,
  },
  {
    provide: MENTION_VALIDATOR_TOKEN,
    useClass: MentionValidator,
  },
  {
    provide: CONTENT_DOMAIN_SERVICE_TOKEN,
    useClass: ContentDomainService,
  },
  /** CronService */
  ArticleCron,

  /** Application */
  CreateDraftPostHandler,
  PublishPostHandler,
  AutoSavePostHandler,
  ProcessPostPublishedHandler,
  ProcessPostUpdatedHandler,
  CreateSeriesHandler,
  UpdateSeriesHandler,
  DeleteSeriesHandler,
  ProcessSeriesPublishedHandler,
  ProcessSeriesDeletedHandler,
  ProcessSeriesUpdatedHandler,
  SeriesCreatedEventHandler,
  SeriesUpdatedEventHandler,
  SeriesDeletedEventHandler,
  FindPostHandler,
  FindArticleHandler,
  CreateDraftArticleHandler,
  MarkReadImportantContentHandler,
  ValidateSeriesTagsHandler,
  UpdatePostHandler,
  FindTimelineGroupHandler,
  FindPostsByIdsHandler,
  FindNewsfeedHandler,
  FindSeriesHandler,
  FindItemsBySeriesHandler,
  AutoSaveArticleHandler,
  PublishArticleHandler,
  UpdateArticleHandler,
  DeleteArticleHandler,
  ScheduleArticleHandler,
  ProcessArticleScheduledHandler,
  ProcessArticlePublishedHandler,
  ProcessArticleUpdatedHandler,
  ProcessArticleDeletedHandler,
  UpdateContentSettingHandler,
  FindDraftContentsHandler,

  /** Event Handler */
  ArticleDeletedEventHandler,
  ArticlePublishedEventHandler,
  ArticleUpdatedEventHandler,
];
