export interface IUserNewsfeedRepository {
  attachContentIdToUserId(contentId: string, userId: string): Promise<void>;
  detachContentIdFromUserId(contentId: string, userId: string): Promise<void>;

  attachContentIdToUserIds(contentId: string, userIds: string[]): Promise<void>;
  detachContentIdFromUserIds(contentId: string, userIds: string[]): Promise<void>;

  attachContentIdsToUserId(contentIds: string[], userId: string): Promise<void>;
  detachContentIdsFromUserId(contentIds: string[], userId: string): Promise<void>;
}

export const USER_NEWSFEED_REPOSITORY_TOKEN = 'USER_NEWSFEED_REPOSITORY_TOKEN';
