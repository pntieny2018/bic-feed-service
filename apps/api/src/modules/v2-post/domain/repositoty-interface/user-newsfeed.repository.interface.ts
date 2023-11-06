export interface IUserNewsfeedRepository {
  hasPublishedContentIdToUserId(contentId: string, userId: string): Promise<boolean>;
  attachContentIdToUserId(contentId: string, userId: string): Promise<void>;
  detachContentIdFromUserId(contentId: string, userId: string): Promise<void>;
}

export const USER_NEWSFEED_REPOSITORY_TOKEN = 'USER_NEWSFEED_REPOSITORY_TOKEN';
