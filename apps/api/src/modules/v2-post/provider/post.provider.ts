import {
  POST_DOMAIN_SERVICE_TOKEN,
  SERIES_DOMAIN_SERVICE_TOKEN,
} from '../domain/domain-service/interface';
import {
  ARTICLE_FACTORY_TOKEN,
  POST_FACTORY_TOKEN,
  SERIES_FACTORY_TOKEN,
} from '../domain/factory/interface';
import {
  CONTENT_VALIDATOR_TOKEN,
  MENTION_VALIDATOR_TOKEN,
  POST_VALIDATOR_TOKEN,
} from '../domain/validator/interface';
import { ContentValidator } from '../domain/validator/content.validator';
import { PostFactory, ArticleFactory, SeriesFactory } from '../domain/factory';
import { PostDomainService } from '../domain/domain-service/post.domain-service';
import { CONTENT_REPOSITORY_TOKEN } from '../domain/repositoty-interface';
import { ContentRepository } from '../driven-adapter/repository/content.repository';
import { CreateDraftPostHandler } from '../application/command/create-draft-post/create-draft-post.handler';
import { PublishPostHandler } from '../application/command/publish-post/publish-post.handler';
import { PostValidator } from '../domain/validator/post.validator';
import { CONTENT_BINDING_TOKEN } from '../application/binding/binding-post/content.interface';
import { ContentBinding } from '../application/binding/binding-post/content.binding';
import { MentionValidator } from '../domain/validator/mention.validator';
import { AutoSavePostHandler } from '../application/command/auto-save-post/auto-save-post.handler';
import { ProcessPostPublishedHandler } from '../application/command/process-post-published/process-post-published.handler';
import { ProcessPostUpdatedHandler } from '../application/command/process-post-updated/process-post-updated.handler';
import { SeriesDomainService } from '../domain/domain-service/series.domain-service';
import { CreateSeriesHandler } from '../application/command/create-series/create-series.handler';
import { UpdateSeriesHandler } from '../application/command/update-series/update-series.handler';
import { FindPostHandler } from '../application/query/find-post/find-post.handler';
import { FindArticleHandler } from '../application/query/find-article/find-article.handler';
import { CreateDraftArticleHandler } from '../application/command/create-draft-article/create-draft-article.handler';
import { MarkReadImportantContentHandler } from '../application/command/mark-read-important-content/mark-read-important-content.handler';
import { ValidateSeriesTagsHandler } from '../application/command/validate-series-tags/validate-series-tags.handler';
import { UpdatePostHandler } from '../application/command/update-post/update-post.handler';
import { FindTimelineGroupHandler } from '../application/query/find-timeline-group/find-timeline-group.handler';
import { FindPostsByIdsHandler } from '../application/query/find-posts-by-ids/find-posts-by-ids.handler';
import { FindNewsfeedHandler } from '../application/query/find-newsfeed/find-newsfeed.handler';
import { DeleteSeriesHandler } from '../application/command/delete-series/delete-series.handler';

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
  /** Application */
  CreateDraftPostHandler,
  PublishPostHandler,
  AutoSavePostHandler,
  ProcessPostPublishedHandler,
  ProcessPostUpdatedHandler,
  CreateSeriesHandler,
  UpdateSeriesHandler,
  DeleteSeriesHandler,
  FindPostHandler,
  FindArticleHandler,
  CreateDraftArticleHandler,
  MarkReadImportantContentHandler,
  ValidateSeriesTagsHandler,
  UpdatePostHandler,
  FindTimelineGroupHandler,
  FindPostsByIdsHandler,
  FindNewsfeedHandler,
];
