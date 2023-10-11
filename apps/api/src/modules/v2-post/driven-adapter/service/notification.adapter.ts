import { Inject } from '@nestjs/common';

import {
  ArticleNotificationPayload,
  CONTENT_NOTIFICATION_APPLICATION_SERVICE,
  IContentNotificationApplicationService,
  PostNotificationPayload,
  SeriesNotificationPayload,
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

  public async sendSeriesNotification(payload: SeriesNotificationPayload): Promise<void> {
    return this._contentNotiApp.sendSeriesNotification(payload);
  }
}
