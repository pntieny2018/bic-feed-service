import {
  ArticleNotificationPayload,
  PostNotificationPayload,
  SeriesAddedItemNotificationPayload,
  SeriesChangedItemNotificationPayload,
  SeriesDeletedNotificationPayload,
  SeriesPublishedNotificationPayload,
  SeriesRemovedItemNotificationPayload,
  SeriesUpdatedNotificationPayload,
} from '../../../v2-notification/application/application-services/interface';

export const NOTIFICATION_ADAPTER = 'NOTIFICATION_ADAPTER';

export interface INotificationAdapter {
  sendPostNotification(payload: PostNotificationPayload): Promise<void>;
  sendArticleNotification(payload: ArticleNotificationPayload): Promise<void>;
  sendSeriesPublishedNotification(payload: SeriesPublishedNotificationPayload): Promise<void>;
  sendSeriesDeletedNotification(payload: SeriesDeletedNotificationPayload): Promise<void>;
  sendSeriesUpdatedNotification(payload: SeriesUpdatedNotificationPayload): Promise<void>;
  sendSeriesAddedItemNotification(payload: SeriesAddedItemNotificationPayload): Promise<void>;
  sendSeriesRemovedItemNotification(payload: SeriesRemovedItemNotificationPayload): Promise<void>;
  sendSeriesChangedItemNotification(payload: SeriesChangedItemNotificationPayload): Promise<void>;
}
