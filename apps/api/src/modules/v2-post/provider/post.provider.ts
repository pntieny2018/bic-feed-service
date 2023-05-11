import { CreateTagHandler } from '../application/command/create-tag/create-tag.handler';
import { DeleteTagHandler } from '../application/command/delete-tag/delete-tag.handler';
import { UpdateTagHandler } from '../application/command/update-tag/update-tag.handler';
import { FindTagsPaginationHandler } from '../application/query/find-tags/find-tags-pagination.handler';
import { TAG_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface';
import { TAG_FACTORY_TOKEN } from '../domain/factory/interface';
import { CONTENT_VALIDATOR_TOKEN } from '../domain/validator/interface/content.validator.interface';
import { ContentValidator } from '../domain/validator/content.validator';
import { POST_FACTORY_TOKEN } from '../domain/factory/interface';
import { PostFactory, TagFactory } from '../domain/factory';
import { TagDomainService } from '../domain/domain-service';

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
    provide: TAG_DOMAIN_SERVICE_TOKEN,
    useClass: TagDomainService,
  },
  {
    provide: TAG_FACTORY_TOKEN,
    useClass: TagFactory,
  },
  /** Application */
  CreateTagHandler,
  UpdateTagHandler,
  DeleteTagHandler,
  FindTagsPaginationHandler,
];
