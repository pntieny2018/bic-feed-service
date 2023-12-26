import {
  FeedArticlePublishedEventHandler,
  FeedArticleUpdatedEventHandler,
  FeedPostPublishedEventHandler,
  FeedPostUpdatedEventHandler,
  FeedSeriesPublishedEventHandler,
  FeedSeriesUpdatedEventHandler,
} from '../application/event-handler/update-newsfeed';
import { USER_NEWSFEED_REPOSITORY_TOKEN } from '../domain/repositoty-interface';
import { UserNewsfeedRepository } from '../driven-adapter/repository';

export const feedProvider = [
  /** Application Event Handler */
  FeedArticlePublishedEventHandler,
  FeedArticleUpdatedEventHandler,
  FeedPostPublishedEventHandler,
  FeedPostUpdatedEventHandler,
  FeedSeriesPublishedEventHandler,
  FeedSeriesUpdatedEventHandler,

  {
    provide: USER_NEWSFEED_REPOSITORY_TOKEN,
    useClass: UserNewsfeedRepository,
  },
];
