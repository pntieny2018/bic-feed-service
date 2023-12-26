export interface IUserNewsfeedRepository {
  attachContentIdToUserId(contentId: string, userId: string): Promise<void>;
}

export const USER_NEWSFEED_REPOSITORY_TOKEN = 'USER_NEWSFEED_REPOSITORY_TOKEN';
