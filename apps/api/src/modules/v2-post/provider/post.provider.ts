import { POST_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface';
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
import { PostFactory } from '../domain/factory';
import { PostDomainService } from '../domain/domain-service/post.domain-service';
import { POST_REPOSITORY_TOKEN } from '../domain/repositoty-interface';
import { PostRepository } from '../driven-adapter/repository/post.repository';
import { CreateDraftPostHandler } from '../application/command/create-draft-post/create-draft-post.handler';
import { PublishPostHandler } from '../application/command/publish-post/publish-post.handler';
import { PostValidator } from '../domain/validator/post.validator';
import { ArticleFactory } from '../domain/factory/article.factory';
import { SeriesFactory } from '../domain/factory/series.factory';
import { CONTENT_BINDING_TOKEN } from '../application/binding/binding-post/content.interface';
import { ContentBinding } from '../application/binding/binding-post/content.binding';
import { MentionValidator } from '../domain/validator/mention.validator';

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
    provide: POST_REPOSITORY_TOKEN,
    useClass: PostRepository,
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
];
