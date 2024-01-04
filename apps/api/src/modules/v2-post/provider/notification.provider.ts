import {
  NotiArticleDeletedEventHandler,
  NotiArticlePublishedEventHandler,
  NotiArticleUpdatedEventHandler,
  NotiPostDeletedEventHandler,
  NotiPostPublishedEventHandler,
  NotiPostUpdatedEventHandler,
  NotiSeriesDeletedEventHandler,
  NotiSeriesPublishedEventHandler,
  NotiSeriesUpdatedEventHandler,
  NotiSeriesItemsAddedEventHandler,
  NotiSeriesItemsRemovedEventHandler,
  NotiSeriesSameOwnerChangedEventHandler,
  NotiCreatedReactionEventHandler,
  NotiDeletedReactionEventHandler,
  NotiPostVideoFailedEventHandler,
  NotiReportCreatedEventHandler,
  NotiReportHiddenEventHandler,
  NotiPostVideoSuccessEventHandler,
} from '../application/event-handler/send-notification';

export const notificationProvider = [
  /** Application Event Handler */
  NotiArticleDeletedEventHandler,
  NotiArticlePublishedEventHandler,
  NotiArticleUpdatedEventHandler,

  NotiPostDeletedEventHandler,
  NotiPostPublishedEventHandler,
  NotiPostUpdatedEventHandler,
  NotiPostVideoSuccessEventHandler,
  NotiPostVideoFailedEventHandler,

  NotiSeriesDeletedEventHandler,
  NotiSeriesPublishedEventHandler,
  NotiSeriesUpdatedEventHandler,

  NotiSeriesItemsAddedEventHandler,
  NotiSeriesItemsRemovedEventHandler,
  NotiSeriesSameOwnerChangedEventHandler,

  NotiCreatedReactionEventHandler,
  NotiDeletedReactionEventHandler,

  NotiReportCreatedEventHandler,
  NotiReportHiddenEventHandler,
];
