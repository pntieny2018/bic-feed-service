export type GetUserFollowsGroupIdsProps = {
  groupIds: string[];
  notExistInGroupIds: string[];
  zindex: number;
  limit: number;
};
export interface IFollowRepository {
  bulkCreate(data: { userId: string; groupId: string }[]): Promise<void>;
  deleteByUserIdAndGroupIds(userId: string, groupIds: string[]): Promise<void>;
}

export const FOLLOW_REPOSITORY_TOKEN = 'FOLLOW_REPOSITORY_TOKEN';
