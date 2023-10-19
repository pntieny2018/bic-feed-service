import { Inject } from '@nestjs/common';

import {
  ArticleNotificationPayload,
  CONTENT_NOTIFICATION_APPLICATION_SERVICE,
  IContentNotificationApplicationService,
  PostNotificationPayload,
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
    private readonly _contentNotiApp: IContentNotificationApplicationService
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
}
