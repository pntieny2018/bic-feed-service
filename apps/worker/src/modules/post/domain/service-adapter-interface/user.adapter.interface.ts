export const USER_ADAPTER = 'USER_ADAPTER';

export interface IUserAdapter {
  getGroupIdsJoinedByUserId(userId: string): Promise<string[]>;
}
