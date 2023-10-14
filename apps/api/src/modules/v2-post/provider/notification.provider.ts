import {
  NotiArticleDeletedEventHandler,
  NotiArticlePublishedEventHandler,
  NotiArticleUpdatedEventHandler,
  NotiSeriesItemsAddedEventHandler,
  NotiSeriesItemsRemovedEventHandler,
  NotiSeriesSameOwnerChangedEventHandler,
} from '../application/event-handler/notification';

export const notificationProvider = [
  /** Application Event Handler */
  NotiArticleDeletedEventHandler,
  NotiArticlePublishedEventHandler,
  NotiArticleUpdatedEventHandler,

  NotiSeriesItemsAddedEventHandler,
  NotiSeriesItemsRemovedEventHandler,
  NotiSeriesSameOwnerChangedEventHandler,
];
