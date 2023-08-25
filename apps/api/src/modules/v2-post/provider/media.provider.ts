import { MEDIA_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface/media.domain-service.interface';
import { MediaDomainService } from '../domain/domain-service/media.domain-service';
import { MEDIA_REPOSITORY_TOKEN } from '../domain/repositoty-interface';
import { MediaMapper } from '../driven-adapter/mapper/media.mapper';
import { MediaRepository } from '../driven-adapter/repository/media.repository';

export const mediaProvider = [
  {
    provide: MEDIA_REPOSITORY_TOKEN,
    useClass: MediaRepository,
  },
  {
    provide: MEDIA_DOMAIN_SERVICE_TOKEN,
    useClass: MediaDomainService,
  },
  MediaMapper,
];
