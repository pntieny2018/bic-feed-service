import { POST_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface';
import { POST_FACTORY_TOKEN } from '../domain/factory/interface';
import { CONTENT_VALIDATOR_TOKEN } from '../domain/validator/interface/content.validator.interface';
import { ContentValidator } from '../domain/validator/content.validator';
import { PostFactory } from '../domain/factory';
import { PostDomainService } from '../domain/domain-service/post.domain-service';
import { POST_REPOSITORY_TOKEN } from '../domain/repositoty-interface/post.repository.interface';
import { PostRepository } from '../driven-adapter/repository/post.repository';
import { CreateDraftPostHandler } from '../application/command/create-draft-post/create-draft-post.handler';

export const postProvider = [
  {
    provide: CONTENT_VALIDATOR_TOKEN,
    useClass: ContentValidator,
  },
  {
    provide: POST_FACTORY_TOKEN,
    useClass: PostFactory,
  },
  {
    provide: POST_DOMAIN_SERVICE_TOKEN,
    useClass: PostDomainService,
  },
  {
    provide: POST_REPOSITORY_TOKEN,
    useClass: PostRepository,
  },
  /** Application */
  CreateDraftPostHandler,
];
