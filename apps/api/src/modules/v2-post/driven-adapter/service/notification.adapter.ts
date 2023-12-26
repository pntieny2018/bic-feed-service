import { Inject } from '@nestjs/common';

import {
  ArticleDeletedNotificationPayload,
  ArticlePublishedNotificationPayload,
  ArticleUpdatedNotificationPayload,
  ChildCommentCreatedNotificationPayload,
  ChildCommentUpdatedNotificationPayload,
  COMMENT_NOTIFICATION_APPLICATION_SERVICE,
  CommentCreatedNotificationPayload,
  CommentDeletedNotificationPayload,
  CommentUpdatedNotificationPayload,
  CONTENT_NOTIFICATION_APPLICATION_SERVICE,
  ICommentNotificationApplicationService,
  IContentNotificationApplicationService,
  IReactionNotificationApplicationService,
  IReportNotificationApplicationService,
  PostDeletedNotificationPayload,
  PostPublishedNotificationPayload,
  PostUpdatedNotificationPayload,
  PostVideoProcessFailedNotificationPayload,
  REACTION_NOTIFICATION_APPLICATION_SERVICE,
  ReactionCommentNotificationPayload,
  ReactionContentNotificationPayload,
  ReactionReplyCommentNotificationPayload,
  REPORT_NOTIFICATION_APPLICATION_SERVICE,
  ReportCreatedNotificationPayload,
  ReportHiddenNotificationPayload,
  SeriesAddedItemNotificationPayload,
  SeriesChangedItemNotificationPayload,
  SeriesDeletedNotificationPayload,
  SeriesPublishedNotificationPayload,
  SeriesRemovedItemNotificationPayload,
  SeriesUpdatedNotificationPayload,
} from '../../../v2-notification/application/application-services/interface';
import { INotificationAdapter } from '../../domain/service-adapter-interface';

export class NotificationAdapter implements INotificationAdapter {
  public constructor(
    @Inject(CONTENT_NOTIFICATION_APPLICATION_SERVICE)
    private readonly _contentNotiApp: IContentNotificationApplicationService,
    @Inject(COMMENT_NOTIFICATION_APPLICATION_SERVICE)
    private readonly _commentNotiApp: ICommentNotificationApplicationService,
    @Inject(REACTION_NOTIFICATION_APPLICATION_SERVICE)
    private readonly _reactionNotiApp: IReactionNotificationApplicationService,
    @Inject(REPORT_NOTIFICATION_APPLICATION_SERVICE)
    private readonly _reportNotiApp: IReportNotificationApplicationService
  ) {}

  public async sendPostDeletedNotification(payload: PostDeletedNotificationPayload): Promise<void> {
    return this._contentNotiApp.sendPostDeletedNotification(payload);
  }

  public async sendPostPublishedNotification(
    payload: PostPublishedNotificationPayload
  ): Promise<void> {
    return this._contentNotiApp.sendPostPublishedNotification(payload);
  }

  public async sendPostUpdatedNotification(payload: PostUpdatedNotificationPayload): Promise<void> {
    return this._contentNotiApp.sendPostUpdatedNotification(payload);
  }

  public async sendPostVideoProcessFailedNotification(
    payload: PostVideoProcessFailedNotificationPayload
  ): Promise<void> {
    return this._contentNotiApp.sendPostVideoProcessFailedNotification(payload);
  }

  public async sendArticleUpdatedNotification(
    payload: ArticleUpdatedNotificationPayload
  ): Promise<void> {
    return this._contentNotiApp.sendArticleUpdatedNotification(payload);
  }

  public async sendArticlePublishedNotification(
    payload: ArticlePublishedNotificationPayload
  ): Promise<void> {
    return this._contentNotiApp.sendArticlePublishedNotification(payload);
  }

  public async sendArticleDeletedNotification(
    payload: ArticleDeletedNotificationPayload
  ): Promise<void> {
    return this._contentNotiApp.sendArticleDeletedNotification(payload);
  }

  public async sendSeriesPublishedNotification(
    payload: SeriesPublishedNotificationPayload
  ): Promise<void> {
    return this._contentNotiApp.sendSeriesPublishedNotification(payload);
  }

  public async sendSeriesDeletedNotification(
    payload: SeriesDeletedNotificationPayload
  ): Promise<void> {
    return this._contentNotiApp.sendSeriesDeletedNotification(payload);
  }

  public async sendSeriesUpdatedNotification(
    payload: SeriesUpdatedNotificationPayload
  ): Promise<void> {
    return this._contentNotiApp.sendSeriesUpdatedNotification(payload);
  }

  public async sendSeriesAddedItemNotification(
    payload: SeriesAddedItemNotificationPayload
  ): Promise<void> {
    return this._contentNotiApp.sendSeriesAddedItemNotification(payload);
  }

  public async sendSeriesRemovedItemNotification(
    payload: SeriesRemovedItemNotificationPayload
  ): Promise<void> {
    return this._contentNotiApp.sendSeriesRemovedItemNotification(payload);
  }

  public async sendSeriesChangedItemNotification(
    payload: SeriesChangedItemNotificationPayload
  ): Promise<void> {
    return this._contentNotiApp.sendSeriesChangedItemNotification(payload);
  }

  public async sendReactionContentNotification(
    payload: ReactionContentNotificationPayload
  ): Promise<void> {
    return this._reactionNotiApp.sendReactionContentNotification(payload);
  }

  public async sendReactionCommentNotification(
    payload: ReactionCommentNotificationPayload
  ): Promise<void> {
    return this._reactionNotiApp.sendReactionCommentNotification(payload);
  }

  public async sendReactionReplyCommentNotification(
    payload: ReactionReplyCommentNotificationPayload
  ): Promise<void> {
    return this._reactionNotiApp.sendReactionReplyCommentNotification(payload);
  }

  public async sendCommentCreatedNotification(
    payload: CommentCreatedNotificationPayload
  ): Promise<void> {
    return this._commentNotiApp.sendCommentCreatedNotification(payload);
  }

  public async sendChildCommentCreatedNotification(
    payload: ChildCommentCreatedNotificationPayload
  ): Promise<void> {
    return this._commentNotiApp.sendChildCommentCreatedNotification(payload);
  }

  public async sendCommentUpdatedNotification(
    payload: CommentUpdatedNotificationPayload
  ): Promise<void> {
    return this._commentNotiApp.sendCommentUpdatedNotification(payload);
  }

  public async sendChildCommentUpdatedNotification(
    payload: ChildCommentUpdatedNotificationPayload
  ): Promise<void> {
    return this._commentNotiApp.sendChildCommentUpdatedNotification(payload);
  }

  public async sendCommentDeletedNotification(
    payload: CommentDeletedNotificationPayload
  ): Promise<void> {
    return this._commentNotiApp.sendCommentDeletedNotification(payload);
  }

  public async sendReportCreatedNotification(
    payload: ReportCreatedNotificationPayload
  ): Promise<void> {
    return this._reportNotiApp.sendReportCreatedNotification(payload);
  }

  public async sendReportHiddenNotification(
    payload: ReportHiddenNotificationPayload
  ): Promise<void> {
    return this._reportNotiApp.sendReportHiddenNotification(payload);
  }
}
