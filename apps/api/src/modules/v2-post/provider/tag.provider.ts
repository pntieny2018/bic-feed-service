import { LibTagRepository } from '@libs/database/postgres/repository';

import { CreateTagHandler, DeleteTagHandler, UpdateTagHandler } from '../application/command/tag';
import { FindTagsPaginationHandler } from '../application/query/tag';
import { TagDomainService } from '../domain/domain-service';
import { TAG_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface';
import { TAG_REPOSITORY_TOKEN } from '../domain/repositoty-interface';
import { TagMapper } from '../driven-adapter/mapper/tag.mapper';
import { TagRepository } from '../driven-adapter/repository';

export const tagProvider = [
  {
    provide: TAG_REPOSITORY_TOKEN,
    useClass: TagRepository,
  },
  {
    provide: TAG_DOMAIN_SERVICE_TOKEN,
    useClass: TagDomainService,
  },
  LibTagRepository,
  TagMapper,
  /** Application */
  CreateTagHandler,
  UpdateTagHandler,
  DeleteTagHandler,
  FindTagsPaginationHandler,
];
