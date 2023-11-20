import { Inject } from '@nestjs/common';

import {
  ArticleNotificationPayload,
  COMMENT_NOTIFICATION_APPLICATION_SERVICE,
  CommentNotificationPayload,
  CONTENT_NOTIFICATION_APPLICATION_SERVICE,
  ICommentNotificationApplicationService,
  IContentNotificationApplicationService,
  IReactionNotificationApplicationService,
  IReportNotificationApplicationService,
  PostNotificationPayload,
  REACTION_NOTIFICATION_APPLICATION_SERVICE,
  ReactionCommentNotificationPayload,
  ReactionContentNotificationPayload,
  ReactionReplyCommentNotificationPayload,
  REPORT_NOTIFICATION_APPLICATION_SERVICE,
  ReportNotificationPayload,
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

  public async sendPostNotification(payload: PostNotificationPayload): Promise<void> {
    return this._contentNotiApp.sendPostNotification(payload);
  }

  public async sendArticleNotification(payload: ArticleNotificationPayload): Promise<void> {
    return this._contentNotiApp.sendArticleNotification(payload);
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

  public async sendCommentNotification(payload: CommentNotificationPayload): Promise<void> {
    return this._commentNotiApp.sendCommentNotification(payload);
  }

  public async sendReportCreatedNotification(payload: ReportNotificationPayload): Promise<void> {
    return this._reportNotiApp.sendReportCreatedNotification(payload);
  }

  public async sendReportHiddenNotification(payload: ReportNotificationPayload): Promise<void> {
    return this._reportNotiApp.sendReportHiddenNotification(payload);
  }
}
