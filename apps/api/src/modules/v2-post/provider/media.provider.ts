import { MEDIA_REPOSITORY_TOKEN } from '../domain/repositoty-interface/media.repository.interface';
import { MediaRepository } from '../driven-adapter/repository/media.repository';
import { MediaDomainService } from '../domain/domain-service/media.domain-service';
import { MEDIA_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface/media.domain-service.interface';

export const mediaProvider = [
  {
    provide: MEDIA_REPOSITORY_TOKEN,
    useClass: MediaRepository,
  },
  {
    provide: MEDIA_DOMAIN_SERVICE_TOKEN,
    useClass: MediaDomainService,
  },
];
