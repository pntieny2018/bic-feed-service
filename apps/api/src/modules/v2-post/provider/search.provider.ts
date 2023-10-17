import {
  SearchArticleDeletedEventHandler,
  SearchArticlePublishedEventHandler,
  SearchArticleUpdatedEventHandler,
  SearchPostDeletedEventHandler,
  SearchPostPublishedEventHandler,
  SearchPostUpdatedEventHandler,
  SearchSeriesDeletedEventHandler,
  SearchSeriesPublishedEventHandler,
} from '../application/event-handler/search';

export const searchProvider = [
  /** Application Event Handler */
  SearchArticleDeletedEventHandler,
  SearchArticlePublishedEventHandler,
  SearchArticleUpdatedEventHandler,
  SearchPostDeletedEventHandler,
  SearchPostPublishedEventHandler,
  SearchPostUpdatedEventHandler,
  SearchSeriesPublishedEventHandler,
  SearchSeriesDeletedEventHandler,
];
