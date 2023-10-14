import {
  SearchArticleDeletedEventHandler,
  SearchArticlePublishedEventHandler,
  SearchArticleUpdatedEventHandler,
  SearchContentChangedAttachedSeriesEventHandler,
  SearchSeriesItemsAddedEventHandler,
  SearchSeriesItemsRemovedEventHandler,
  SearchSeriesItemsReorderedEventHandler,
} from '../application/event-handler/search';

export const searchProvider = [
  /** Application Event Handler */
  SearchArticleDeletedEventHandler,
  SearchArticlePublishedEventHandler,
  SearchArticleUpdatedEventHandler,

  SearchContentChangedAttachedSeriesEventHandler,

  SearchSeriesItemsReorderedEventHandler,
  SearchSeriesItemsAddedEventHandler,
  SearchSeriesItemsRemovedEventHandler,
];
