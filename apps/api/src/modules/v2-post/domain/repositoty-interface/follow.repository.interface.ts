export type GetUserFollowsGroupIdsProps = {
  groupIds: string[];
  notExistInGroupIds: string[];
  zindex: number;
  limit: number;
};
export interface IFollowRepository {
  getUserFollowGroupIds(input: GetUserFollowsGroupIdsProps): Promise<{
    userIds: string[];
    latestFollowId: number;
  }>;
}

export const FOLLOW_REPOSITORY_TOKEN = 'FOLLOW_REPOSITORY_TOKEN';
