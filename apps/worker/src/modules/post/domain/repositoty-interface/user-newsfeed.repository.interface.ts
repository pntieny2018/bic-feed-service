import { UserNewsFeedAttributes } from '@libs/database/postgres/model';

export type ContentNewsFeedAttributes = Pick<
  UserNewsFeedAttributes,
  'id' | 'type' | 'publishedAt' | 'isImportant' | 'createdBy'
>;

export interface IUserNewsfeedRepository {
  attachContentToUserId(content: ContentNewsFeedAttributes, userId: string): Promise<void>;
  detachContentIdFromUserId(contentId: string, userId: string): Promise<void>;

  attachContentToUserIds(content: ContentNewsFeedAttributes, userIds: string[]): Promise<void>;
  detachContentIdFromUserIds(contentId: string, userIds: string[]): Promise<void>;

  attachContentsToUserId(contents: ContentNewsFeedAttributes[], userId: string): Promise<void>;
  detachContentIdsFromUserId(contentIds: string[], userId: string): Promise<void>;
}

export const USER_NEWSFEED_REPOSITORY_TOKEN = 'USER_NEWSFEED_REPOSITORY_TOKEN';
