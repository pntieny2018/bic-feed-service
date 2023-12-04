import { LibLinkPreviewRepository } from '@libs/database/postgres/repository';

import { LINK_PREVIEW_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface';
import { LinkPreviewDomainService } from '../domain/domain-service/link-preview.domain-service';
import { LINK_PREVIEW_REPOSITORY_TOKEN } from '../domain/repositoty-interface';
import { LinkPreviewMapper } from '../driven-adapter/mapper/link-preview.mapper';
import { LinkPreviewRepository } from '../driven-adapter/repository';

export const linkPreviewProvider = [
  {
    provide: LINK_PREVIEW_REPOSITORY_TOKEN,
    useClass: LinkPreviewRepository,
  },
  {
    provide: LINK_PREVIEW_DOMAIN_SERVICE_TOKEN,
    useClass: LinkPreviewDomainService,
  },
  LibLinkPreviewRepository,
  LinkPreviewMapper,
];
