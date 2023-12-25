import {
  FOLLOW_REPOSITORY_TOKEN,
  USER_NEWSFEED_REPOSITORY_TOKEN,
} from '../domain/repositoty-interface';
import { FollowRepository, UserNewsfeedRepository } from '../driven-adapter/repository';

export const feedProvider = [
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
