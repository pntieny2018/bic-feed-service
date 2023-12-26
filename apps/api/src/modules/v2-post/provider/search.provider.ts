import {
  SearchArticleDeletedEventHandler,
  SearchArticlePublishedEventHandler,
  SearchArticleUpdatedEventHandler,
  SearchContentAttachedSeriesEventHandler,
  SearchPostDeletedEventHandler,
  SearchPostPublishedEventHandler,
  SearchPostUpdatedEventHandler,
  SearchSeriesDeletedEventHandler,
  SearchSeriesPublishedEventHandler,
  SearchSeriesUpdatedEventHandler,
  SearchSeriesItemsAddedEventHandler,
  SearchSeriesItemsRemovedEventHandler,
  SearchSeriesItemsReorderedEventHandler,
  SearchReportHiddenEventHandler,
} from '../application/event-handler/sync-es-search';

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
  SearchSeriesUpdatedEventHandler,

  SearchContentAttachedSeriesEventHandler,
  SearchSeriesItemsReorderedEventHandler,
  SearchSeriesItemsAddedEventHandler,
  SearchSeriesItemsRemovedEventHandler,

  SearchReportHiddenEventHandler,
];
