import { MEDIA_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface/media.domain-service.interface';
import { MediaDomainService } from '../domain/domain-service/media.domain-service';
import { MediaMapper } from '../driven-adapter/mapper/media.mapper';

export const mediaProvider = [
  {
    provide: MEDIA_DOMAIN_SERVICE_TOKEN,
    useClass: MediaDomainService,
  },
  MediaMapper,
];
