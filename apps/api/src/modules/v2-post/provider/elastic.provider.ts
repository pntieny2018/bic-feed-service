import {
  CONTENT_REPOSITORY_TOKEN,
  REPORT_REPOSITORY_TOKEN,
  TAG_REPOSITORY_TOKEN,
} from '@api/modules/v2-post/domain/repositoty-interface';
import {
  ContentRepository,
  ReportRepository,
  TagRepository,
} from '@api/modules/v2-post/driven-adapter/repository';

import { CONTENT_BINDING_TOKEN } from '../application/binding';
import { CONTENT_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface';

/**
 * TODO:  Refactor search module soon to remove this file
 */
export const elasticProvider = [
  CONTENT_BINDING_TOKEN,
  CONTENT_DOMAIN_SERVICE_TOKEN,
  {
    provide: REPORT_REPOSITORY_TOKEN,
    useClass: ReportRepository,
  },
  {
    provide: CONTENT_REPOSITORY_TOKEN,
    useClass: ContentRepository,
  },
  {
    provide: TAG_REPOSITORY_TOKEN,
    useClass: TagRepository,
  },
];
