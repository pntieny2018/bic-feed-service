import { UserDto } from '@libs/service/user';

import { ArticleDto, PostDto, SeriesDto } from '../../../../v2-post/application/dto';

export const CONTENT_NOTIFICATION_APPLICATION_SERVICE = 'CONTENT_NOTIFICATION_APPLICATION_SERVICE';

export type PostVideoProcessSuccessNotificationPayload = {
  actor: UserDto;
  post: PostDto;
};

export type PostVideoProcessFailedNotificationPayload = {
  actor: UserDto;
  post: PostDto;
};

export type PostDeletedNotificationPayload = {
  actor: UserDto;
  post: PostDto;
};

export type PostPublishedNotificationPayload = {
  actor: UserDto;
  post: PostDto;
  ignoreUserIds: string[];
};

export type PostUpdatedNotificationPayload = {
  actor: UserDto;
  post: PostDto;
  oldPost: PostDto;
  ignoreUserIds: string[];
};

export type ArticleUpdatedNotificationPayload = {
  actor: UserDto;
  article: ArticleDto;
  oldArticle: ArticleDto;
  ignoreUserIds: string[];
};

export type ArticleDeletedNotificationPayload = {
  actor: UserDto;
  article: ArticleDto;
};

export type ArticlePublishedNotificationPayload = {
  actor: UserDto;
  article: ArticleDto;
  ignoreUserIds: string[];
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

export interface IContentNotificationApplicationService {
  sendPostDeletedNotification(payload: PostDeletedNotificationPayload): Promise<void>;
  sendPostPublishedNotification(payload: PostPublishedNotificationPayload): Promise<void>;
  sendPostUpdatedNotification(payload: PostUpdatedNotificationPayload): Promise<void>;
  sendPostVideoProcessSuccessNotification(
    payload: PostVideoProcessSuccessNotificationPayload
  ): Promise<void>;
  sendPostVideoProcessFailedNotification(
    payload: PostVideoProcessFailedNotificationPayload
  ): Promise<void>;

  sendArticleDeletedNotification(payload: ArticleDeletedNotificationPayload): Promise<void>;
  sendArticlePublishedNotification(payload: ArticlePublishedNotificationPayload): Promise<void>;
  sendArticleUpdatedNotification(payload: ArticleUpdatedNotificationPayload): Promise<void>;

  sendSeriesPublishedNotification(payload: SeriesPublishedNotificationPayload): Promise<void>;
  sendSeriesDeletedNotification(payload: SeriesDeletedNotificationPayload): Promise<void>;
  sendSeriesUpdatedNotification(payload: SeriesUpdatedNotificationPayload): Promise<void>;
  sendSeriesAddedItemNotification(payload: SeriesAddedItemNotificationPayload): Promise<void>;
  sendSeriesRemovedItemNotification(payload: SeriesRemovedItemNotificationPayload): Promise<void>;
  sendSeriesChangedItemNotification(payload: SeriesChangedItemNotificationPayload): Promise<void>;
}
