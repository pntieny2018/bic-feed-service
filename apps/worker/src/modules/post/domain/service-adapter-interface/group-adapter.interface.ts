export const GROUP_ADAPTER = 'GROUP_ADAPTER';

export type GetUserIdsInGroupsProps = {
  groupIds: string[];
  notInGroupIds: string[];
  ignoreUserIds?: string;
  includeDeactivated?: boolean;
  after?: string;
  limit?: number;
};
export interface IGroupAdapter {
  getUserIdsInGroups(props: GetUserIdsInGroupsProps): Promise<{
    list: string[];
    cursor: string;
  }>;
}
