import { NotiArticlePublishedEventHandler } from '../application/event-handler/notification';
import { NotiArticleDeletedEventHandler } from '../application/event-handler/notification/article-delete.event-handler';

export const notificationProvider = [
  /** Application Event Handler */
  NotiArticleDeletedEventHandler,
  NotiArticlePublishedEventHandler,
];
