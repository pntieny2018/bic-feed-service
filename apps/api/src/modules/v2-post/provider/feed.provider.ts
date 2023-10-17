import {
  FeedArticlePublishedEventHandler,
  FeedArticleUpdatedEventHandler,
  FeedPostPublishedEventHandler,
  FeedPostUpdatedEventHandler,
  FeedSeriesPublishedEventHandler,
} from '../application/event-handler/feed';

export const feedProvider = [
  /** Application Event Handler */
  FeedArticlePublishedEventHandler,
  FeedArticleUpdatedEventHandler,
  FeedPostPublishedEventHandler,
  FeedPostUpdatedEventHandler,
  FeedSeriesPublishedEventHandler,
];
