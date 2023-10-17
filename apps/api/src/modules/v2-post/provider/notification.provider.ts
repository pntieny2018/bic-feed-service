import {
  NotiArticleDeletedEventHandler,
  NotiArticlePublishedEventHandler,
  NotiArticleUpdatedEventHandler,
  NotiPostDeletedEventHandler,
  NotiPostPublishedEventHandler,
  NotiPostUpdatedEventHandler,
  NotiSeriesDeletedEventHandler,
} from '../application/event-handler/notification';

export const notificationProvider = [
  /** Application Event Handler */
  NotiArticleDeletedEventHandler,
  NotiArticlePublishedEventHandler,
  NotiArticleUpdatedEventHandler,
  NotiPostDeletedEventHandler,
  NotiPostPublishedEventHandler,
  NotiPostUpdatedEventHandler,
  NotiSeriesDeletedEventHandler,
];
