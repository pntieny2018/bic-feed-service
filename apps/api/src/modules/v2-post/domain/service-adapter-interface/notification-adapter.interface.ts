import {
  ArticleNotificationPayload,
  CommentNotificationPayload,
  PostNotificationPayload,
  SeriesNotificationPayload,
} from '../../../v2-notification/application/application-services/interface';

export const NOTIFICATION_ADAPTER = 'NOTIFICATION_ADAPTER';

export interface INotificationAdapter {
  sendPostNotification(payload: PostNotificationPayload): Promise<void>;
  sendArticleNotification(payload: ArticleNotificationPayload): Promise<void>;
  sendSeriesNotification(payload: SeriesNotificationPayload): Promise<void>;
  sendCommentNotification(payload: CommentNotificationPayload): Promise<void>;
}
