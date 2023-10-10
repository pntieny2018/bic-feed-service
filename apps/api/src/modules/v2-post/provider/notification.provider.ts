import {
  NotiArticleDeletedEventHandler,
  NotiArticlePublishedEventHandler,
  NotiArticleUpdatedEventHandler,
  NotiPostDeletedEventHandler,
} from '../application/event-handler/notification';

export const notificationProvider = [
  /** Application Event Handler */
  NotiArticleDeletedEventHandler,
  NotiArticlePublishedEventHandler,
  NotiArticleUpdatedEventHandler,
  NotiPostDeletedEventHandler,
];
