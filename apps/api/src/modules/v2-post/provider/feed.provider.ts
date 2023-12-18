import {
  FeedArticlePublishedEventHandler,
  FeedArticleUpdatedEventHandler,
  FeedPostPublishedEventHandler,
  FeedPostUpdatedEventHandler,
  FeedSeriesPublishedEventHandler,
  FeedSeriesUpdatedEventHandler,
} from '../application/event-handler/update-newsfeed';

export const feedProvider = [
  /** Application Event Handler */
  FeedArticlePublishedEventHandler,
  FeedArticleUpdatedEventHandler,
  FeedPostPublishedEventHandler,
  FeedPostUpdatedEventHandler,
  FeedSeriesPublishedEventHandler,
  FeedSeriesUpdatedEventHandler,
];
