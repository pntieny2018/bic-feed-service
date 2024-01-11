export type FindUsersSeenContentProps = {
  contentId: string;
  limit?: number;
  offset?: number;
};

export interface IUserSeenContentRepository {
  findUserIdsSeen(props: FindUsersSeenContentProps): Promise<string[]>;
  getTotalUsersSeen(contentId: string): Promise<number>;
}
export const USER_SEEN_CONTENT_REPOSITORY_TOKEN = 'USER_SEEN_CONTENT_REPOSITORY_TOKEN';
