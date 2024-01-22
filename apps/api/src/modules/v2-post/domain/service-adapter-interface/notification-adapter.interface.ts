import { SpecificNotificationSettings } from '@api/modules/v2-notification/data-type';

import {
  SeriesAddedItemNotificationPayload,
  SeriesChangedItemNotificationPayload,
  SeriesDeletedNotificationPayload,
  SeriesPublishedNotificationPayload,
  SeriesRemovedItemNotificationPayload,
  SeriesUpdatedNotificationPayload,
  ReactionContentNotificationPayload,
  ReactionCommentNotificationPayload,
  ReactionReplyCommentNotificationPayload,
  ArticleUpdatedNotificationPayload,
  ArticlePublishedNotificationPayload,
  ArticleDeletedNotificationPayload,
  PostDeletedNotificationPayload,
  PostPublishedNotificationPayload,
  PostUpdatedNotificationPayload,
  PostVideoProcessFailedNotificationPayload,
  CommentCreatedNotificationPayload,
  CommentUpdatedNotificationPayload,
  CommentDeletedNotificationPayload,
  ChildCommentCreatedNotificationPayload,
  ChildCommentUpdatedNotificationPayload,
  ReportCreatedNotificationPayload,
  ReportHiddenNotificationPayload,
  PostVideoProcessSuccessNotificationPayload,
} from '../../../v2-notification/application/application-services/interface';

export const NOTIFICATION_ADAPTER = 'NOTIFICATION_ADAPTER';

export interface INotificationAdapter {
  sendPostDeletedNotification(payload: PostDeletedNotificationPayload): Promise<void>;
  sendPostPublishedNotification(payload: PostPublishedNotificationPayload): Promise<void>;
  sendPostUpdatedNotification(payload: PostUpdatedNotificationPayload): Promise<void>;
  sendPostVideoProcessSuccessNotification(
    payload: PostVideoProcessSuccessNotificationPayload
  ): Promise<void>;
  sendPostVideoProcessFailedNotification(
    payload: PostVideoProcessFailedNotificationPayload
  ): Promise<void>;

  sendArticleUpdatedNotification(payload: ArticleUpdatedNotificationPayload): Promise<void>;
  sendArticlePublishedNotification(payload: ArticlePublishedNotificationPayload): Promise<void>;
  sendArticleDeletedNotification(payload: ArticleDeletedNotificationPayload): Promise<void>;

  sendReactionContentNotification(payload: ReactionContentNotificationPayload): Promise<void>;
  sendReactionCommentNotification(payload: ReactionCommentNotificationPayload): Promise<void>;
  sendReactionReplyCommentNotification(
    payload: ReactionReplyCommentNotificationPayload
  ): Promise<void>;

  sendSeriesPublishedNotification(payload: SeriesPublishedNotificationPayload): Promise<void>;
  sendSeriesDeletedNotification(payload: SeriesDeletedNotificationPayload): Promise<void>;
  sendSeriesUpdatedNotification(payload: SeriesUpdatedNotificationPayload): Promise<void>;
  sendSeriesAddedItemNotification(payload: SeriesAddedItemNotificationPayload): Promise<void>;
  sendSeriesRemovedItemNotification(payload: SeriesRemovedItemNotificationPayload): Promise<void>;
  sendSeriesChangedItemNotification(payload: SeriesChangedItemNotificationPayload): Promise<void>;

  sendCommentCreatedNotification(payload: CommentCreatedNotificationPayload): Promise<void>;
  sendChildCommentCreatedNotification(
    payload: ChildCommentCreatedNotificationPayload
  ): Promise<void>;
  sendCommentUpdatedNotification(payload: CommentUpdatedNotificationPayload): Promise<void>;
  sendChildCommentUpdatedNotification(
    payload: ChildCommentUpdatedNotificationPayload
  ): Promise<void>;
  sendCommentDeletedNotification(payload: CommentDeletedNotificationPayload): Promise<void>;

  sendReportCreatedNotification(payload: ReportCreatedNotificationPayload): Promise<void>;
  sendReportHiddenNotification(payload: ReportHiddenNotificationPayload): Promise<void>;

  getSpecificNotificationSettings(
    userId: string,
    targetId: string
  ): Promise<SpecificNotificationSettings>;
}
