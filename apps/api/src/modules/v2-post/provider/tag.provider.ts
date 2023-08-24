import { LIB_TAG_REPOSITORY_TOKEN } from '@libs/database/postgres/repository/interface';
import { LibTagRepository } from '@libs/database/postgres/repository/tag.repository';

import { CreateTagHandler, DeleteTagHandler, UpdateTagHandler } from '../application/command/tag';
import { FindTagsPaginationHandler } from '../application/query/tag';
import { TagDomainService } from '../domain/domain-service';
import { TAG_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface';
import { TagFactory } from '../domain/factory';
import { TAG_FACTORY_TOKEN } from '../domain/factory/interface';
import { TAG_QUERY_TOKEN } from '../domain/query-interface';
import { TAG_REPOSITORY_TOKEN } from '../domain/repositoty-interface';
import { TagMapper } from '../driven-adapter/mapper/tag.mapper';
import { TagQuery } from '../driven-adapter/query';
import { TagRepository } from '../driven-adapter/repository';

export const tagProvider = [
  {
    provide: TAG_REPOSITORY_TOKEN,
    useClass: TagRepository,
  },
  {
    provide: TAG_QUERY_TOKEN,
    useClass: TagQuery,
  },
  {
    provide: TAG_DOMAIN_SERVICE_TOKEN,
    useClass: TagDomainService,
  },
  {
    provide: TAG_FACTORY_TOKEN,
    useClass: TagFactory,
  },
  {
    provide: LIB_TAG_REPOSITORY_TOKEN,
    useClass: LibTagRepository,
  },
  TagMapper,
  /** Application */
  CreateTagHandler,
  UpdateTagHandler,
  DeleteTagHandler,
  FindTagsPaginationHandler,
];
