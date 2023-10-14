import {
  SearchArticleDeletedEventHandler,
  SearchArticlePublishedEventHandler,
  SearchArticleUpdatedEventHandler,
  SearchContentAttachedSeriesEventHandler,
  SearchSeriesItemsAddedEventHandler,
  SearchSeriesItemsRemovedEventHandler,
  SearchSeriesItemsReorderedEventHandler,
} from '../application/event-handler/search';

export const searchProvider = [
  /** Application Event Handler */
  SearchArticleDeletedEventHandler,
  SearchArticlePublishedEventHandler,
  SearchArticleUpdatedEventHandler,

  SearchContentAttachedSeriesEventHandler,

  SearchSeriesItemsReorderedEventHandler,
  SearchSeriesItemsAddedEventHandler,
  SearchSeriesItemsRemovedEventHandler,
];
