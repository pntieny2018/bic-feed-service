import {
  SearchArticleDeletedEventHandler,
  SearchArticlePublishedEventHandler,
  SearchArticleUpdatedEventHandler,
  SearchPostDeletedEventHandler,
  SearchPostPublishedEventHandler,
  SearchPostUpdatedEventHandler,
  SearchSeriesDeletedEventHandler,
} from '../application/event-handler/search';

export const searchProvider = [
  /** Application Event Handler */
  SearchArticleDeletedEventHandler,
  SearchArticlePublishedEventHandler,
  SearchArticleUpdatedEventHandler,
  SearchPostDeletedEventHandler,
  SearchPostPublishedEventHandler,
  SearchPostUpdatedEventHandler,
  SearchSeriesDeletedEventHandler,
];
