import {
  FeedArticlePublishedEventHandler,
  FeedArticleUpdatedEventHandler,
  FeedPostPublishedEventHandler,
  FeedPostUpdatedEventHandler,
  FeedSeriesPublishedEventHandler,
  FeedSeriesUpdatedEventHandler,
} from '../application/event-handler/update-newsfeed';
import {
  FOLLOW_REPOSITORY_TOKEN,
  USER_NEWSFEED_REPOSITORY_TOKEN,
} from '../domain/repositoty-interface';
import { FollowRepository } from '../driven-adapter/repository';
import { UserNewsfeedRepository } from '../driven-adapter/repository/user-newsfeed.repository';

export const feedProvider = [
  /** Application Event Handler */
  FeedArticlePublishedEventHandler,
  FeedArticleUpdatedEventHandler,
  FeedPostPublishedEventHandler,
  FeedPostUpdatedEventHandler,
  FeedSeriesPublishedEventHandler,
  FeedSeriesUpdatedEventHandler,

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
