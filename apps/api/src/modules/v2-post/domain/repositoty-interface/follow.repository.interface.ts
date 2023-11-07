export type GetUserFollowsGroupIdsProps = {
  groupIds: string[];
  notExistInGroupIds: string[];
  zindex: number;
  limit: number;
};
export interface IFollowRepository {
  findUsersFollowedGroupIds(input: GetUserFollowsGroupIdsProps): Promise<{
    userIds: string[];
    latestFollowId: number;
  }>;
  findGroupIdsUserFollowed(userId: string): Promise<string[]>;
  bulkCreate(data: { userId: string; groupId: string }[]): Promise<void>;
  deleteByUserIdAndGroupIds(userId: string, groupIds: string[]): Promise<void>;
}

export const FOLLOW_REPOSITORY_TOKEN = 'FOLLOW_REPOSITORY_TOKEN';
