import { POST_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface';
import {
  ARTICLE_FACTORY_TOKEN,
  POST_FACTORY_TOKEN,
  SERIES_FACTORY_TOKEN,
} from '../domain/factory/interface';
import { CONTENT_VALIDATOR_TOKEN, POST_VALIDATOR_TOKEN } from '../domain/validator/interface';
import { ContentValidator } from '../domain/validator/content.validator';
import { PostFactory } from '../domain/factory';
import { PostDomainService } from '../domain/domain-service/post.domain-service';
import { POST_REPOSITORY_TOKEN } from '../domain/repositoty-interface/post.repository.interface';
import { PostRepository } from '../driven-adapter/repository/post.repository';
import { CreateDraftPostHandler } from '../application/command/create-draft-post/create-draft-post.handler';
import { PublishPostHandler } from '../application/command/publish-post/publish-post.handler';
import { PostValidator } from '../domain/validator/post.validator';
import { ArticleFactory } from '../domain/factory/article.factory';
import { SeriesFactory } from '../domain/factory/series.factory';
import { LINK_PREVIEW_REPOSITORY_TOKEN } from '../domain/repositoty-interface';
import { LinkPreviewRepository } from '../driven-adapter/repository/link-preview.repository';
import { LINK_PREVIEW_FACTORY_TOKEN } from '../domain/factory/interface/link-preview.factory.interface';
import { LinkPreviewFactory } from '../domain/factory/link-preview.factory';
import { LINK_PREVIEW_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface/link-preview.domain-service.interface';
import { LinkPreviewDomainService } from '../domain/domain-service/link-preview.domain-service';

export const linkPreviewProvider = [
  {
    provide: LINK_PREVIEW_REPOSITORY_TOKEN,
    useClass: LinkPreviewRepository,
  },
  {
    provide: LINK_PREVIEW_FACTORY_TOKEN,
    useClass: LinkPreviewFactory,
  },
  {
    provide: LINK_PREVIEW_DOMAIN_SERVICE_TOKEN,
    useClass: LinkPreviewDomainService,
  },
];
