import { NewsfeedDomainService } from '../domain/domain-service';
import { NEWSFEED_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface';
import {
  FOLLOW_REPOSITORY_TOKEN,
  USER_NEWSFEED_REPOSITORY_TOKEN,
} from '../domain/repositoty-interface';
import { FollowRepository, UserNewsfeedRepository } from '../driven-adapter/repository';

export const feedProvider = [
  {
    provide: NEWSFEED_DOMAIN_SERVICE_TOKEN,
    useClass: NewsfeedDomainService,
  },

  /* Repository */
  {
    provide: FOLLOW_REPOSITORY_TOKEN,
    useClass: FollowRepository,
  },
  {
    provide: USER_NEWSFEED_REPOSITORY_TOKEN,
    useClass: UserNewsfeedRepository,
  },
];
