import { UserDto } from '@libs/service/user';

import { ArticleDto, PostDto, SeriesDto } from '../../../../v2-post/application/dto';
import { TargetType, VerbActivity } from '../../../data-type';

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

export type SeriesNotificationPayload = {
  event: string;
  actor: UserDto;
  series: SeriesDto;
  item: PostDto | ArticleDto;
  verb: VerbActivity;
  targetUserIds?: string[];
  isSendToContentCreator?: boolean;
  contentIsDeleted?: boolean;
  context?: string;
};

export type ContentNotificationPayload = {
  event: string;
  actor: UserDto;
  content: PostDto | ArticleDto;
  seriesWithState: { item: SeriesDto; state: 'add' | 'remove' }[];
  verb: VerbActivity;
  targetType: TargetType;
};

export interface IContentNotificationApplicationService {
  sendPostNotification(payload: PostNotificationPayload): Promise<void>;
  sendArticleNotification(payload: ArticleNotificationPayload): Promise<void>;
  sendSeriesNotification(payload: SeriesNotificationPayload): Promise<void>;
  sendContentNotification(payload: ContentNotificationPayload): Promise<void>;
}
