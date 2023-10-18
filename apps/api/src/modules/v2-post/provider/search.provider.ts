import {
  SearchArticleDeletedEventHandler,
  SearchArticlePublishedEventHandler,
  SearchArticleUpdatedEventHandler,
  SearchContentAttachedSeriesEventHandler,
  SearchPostDeletedEventHandler,
  SearchPostPublishedEventHandler,
  SearchPostUpdatedEventHandler,
  SearchSeriesItemsAddedEventHandler,
  SearchSeriesItemsRemovedEventHandler,
  SearchSeriesItemsReorderedEventHandler,
} from '../application/event-handler/search';

export const searchProvider = [
  /** Application Event Handler */
  SearchArticleDeletedEventHandler,
  SearchArticlePublishedEventHandler,
  SearchArticleUpdatedEventHandler,

  SearchPostDeletedEventHandler,
  SearchPostPublishedEventHandler,
  SearchPostUpdatedEventHandler,

  SearchContentAttachedSeriesEventHandler,
  SearchSeriesItemsReorderedEventHandler,
  SearchSeriesItemsAddedEventHandler,
  SearchSeriesItemsRemovedEventHandler,
];
