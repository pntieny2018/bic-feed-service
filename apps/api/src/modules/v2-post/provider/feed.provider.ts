import {
  FeedArticlePublishedEventHandler,
  FeedArticleUpdatedEventHandler,
} from '../application/event-handler/feed';

export const feedProvider = [
  /** Application Event Handler */
  FeedArticlePublishedEventHandler,
  FeedArticleUpdatedEventHandler,
];
