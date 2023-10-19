import { UserDto } from '@libs/service/user';

import { ArticleDto, PostDto, SeriesDto } from '../../../../v2-post/application/dto';
import { VerbActivity } from '../../../data-type';

export const CONTENT_NOTIFICATION_APPLICATION_SERVICE = 'CONTENT_NOTIFICATION_APPLICATION_SERVICE';

export type PostNotificationPayload = {
  event: string;
  actor: UserDto;
  post: PostDto;
  oldPost?: PostDto;
  ignoreUserIds?: string[];
};

export type ArticleNotificationPayload = {
  event: string;
  actor: UserDto;
  article: ArticleDto;
  oldArticle?: ArticleDto;
  ignoreUserIds?: string[];
};

export type SeriesPublishedNotificationPayload = {
  actor: UserDto;
  series: SeriesDto;
  targetUserIds: string[];
};

export type SeriesDeletedNotificationPayload = {
  actor: UserDto;
  series: SeriesDto;
};

export type SeriesUpdatedNotificationPayload = {
  actor: UserDto;
  series: SeriesDto;
  oldSeries: SeriesDto;
  targetUserIds: string[];
};

export type SeriesAddedItemNotificationPayload = {
  actor: UserDto;
  series: SeriesDto;
  item: PostDto | ArticleDto;
  isSendToContentCreator: boolean;
  context: string;
};

export type SeriesRemovedItemNotificationPayload = {
  actor: UserDto;
  series: SeriesDto;
  item: PostDto | ArticleDto;
  isSendToContentCreator: boolean;
  contentIsDeleted: boolean;
};

export type SeriesChangedItemNotificationPayload = {
  actor: UserDto;
  series: (SeriesDto & { state: 'add' | 'remove' })[];
  item: PostDto | ArticleDto;
};

export type SeriesNotificationPayload = {
  event: string;
  actor: UserDto;
  series: SeriesDto | SeriesWithStateDto[];
  oldSeries?: SeriesDto;
  item?: PostDto | ArticleDto;
  verb: VerbActivity;
  targetUserIds?: string[];
  isSendToContentCreator?: boolean;
  contentIsDeleted?: boolean;
  context?: string;
};

export type SeriesWithStateDto = SeriesDto & {
  state: 'add' | 'remove';
};

export interface IContentNotificationApplicationService {
  sendPostNotification(payload: PostNotificationPayload): Promise<void>;
  sendArticleNotification(payload: ArticleNotificationPayload): Promise<void>;
  sendSeriesPublishedNotification(payload: SeriesPublishedNotificationPayload): Promise<void>;
  sendSeriesDeletedNotification(payload: SeriesDeletedNotificationPayload): Promise<void>;
  sendSeriesUpdatedNotification(payload: SeriesUpdatedNotificationPayload): Promise<void>;
  sendSeriesAddedItemNotification(payload: SeriesAddedItemNotificationPayload): Promise<void>;
  sendSeriesRemovedItemNotification(payload: SeriesRemovedItemNotificationPayload): Promise<void>;
  sendSeriesChangedItemNotification(payload: SeriesChangedItemNotificationPayload): Promise<void>;
}
