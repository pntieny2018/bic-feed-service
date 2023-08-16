import { ContentBinding } from '../application/binding/binding-post/content.binding';
import { CONTENT_BINDING_TOKEN } from '../application/binding/binding-post/content.interface';
import { AutoSaveArticleHandler } from '../application/command/auto-save-article/auto-save-article.handler';
import { AutoSavePostHandler } from '../application/command/auto-save-post/auto-save-post.handler';
import { CreateDraftArticleHandler } from '../application/command/create-draft-article/create-draft-article.handler';
import { CreateDraftPostHandler } from '../application/command/create-draft-post/create-draft-post.handler';
import { CreateSeriesHandler } from '../application/command/create-series/create-series.handler';
import { DeleteArticleHandler } from '../application/command/delete-article/delete-article.handler';
import { DeleteSeriesHandler } from '../application/command/delete-series/delete-series.handler';
import { MarkReadImportantContentHandler } from '../application/command/mark-read-important-content/mark-read-important-content.handler';
import { ProcessArticleDeletedHandler } from '../application/command/process-article-deleted/process-article-deleted.handler';
import { ProcessArticlePublishedHandler } from '../application/command/process-article-published/process-article-published.handler';
import { ProcessArticleScheduledHandler } from '../application/command/process-article-scheduled/process-article-scheduled.handler';
import { ProcessArticleUpdatedHandler } from '../application/command/process-article-updated/process-article-updated.handler';
import { ProcessPostPublishedHandler } from '../application/command/process-post-published/process-post-published.handler';
import { ProcessPostUpdatedHandler } from '../application/command/process-post-updated/process-post-updated.handler';
import { ProcessReactionNotificationHandler } from '../application/command/process-reaction-notification/process-reaction-notification.handler';
import { ProcessSeriesDeletedHandler } from '../application/command/process-series-deleted/process-series-deleted.handler';
import { ProcessSeriesPublishedHandler } from '../application/command/process-series-published/process-series-published.handler';
import { ProcessSeriesUpdatedHandler } from '../application/command/process-series-updated/process-series-updated.handler';
import { PublishArticleHandler } from '../application/command/publish-article/publish-article.handler';
import { PublishPostHandler } from '../application/command/publish-post/publish-post.handler';
import { ScheduleArticleHandler } from '../application/command/schedule-article/schedule-article.handler';
import { UpdateArticleHandler } from '../application/command/update-article/update-article.handler';
import { UpdateContentSettingHandler } from '../application/command/update-content-setting/update-content-setting.handler';
import { UpdatePostHandler } from '../application/command/update-post/update-post.handler';
import { UpdateSeriesHandler } from '../application/command/update-series/update-series.handler';
import { ValidateSeriesTagsHandler } from '../application/command/validate-series-tags/validate-series-tags.handler';
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
  ProcessReactionNotificationHandler,
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
