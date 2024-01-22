export const GROUP_ADAPTER = 'GROUP_ADAPTER';

export type GetGroupsMembersProps = {
  groupIds: string[];
  notInGroupIds: string[];
  ignoreUserIds?: string;
  includeDeactivated?: boolean;
  offset: number;
  limit: number;
};

export type CountUsersInGroupsProps = {
  groupIds: string[];
  notInGroupIds: string[];
  ignoreUserIds?: string;
  includeDeactivated?: boolean;
};
export interface IGroupAdapter {
  getGroupsMembers(props: GetGroupsMembersProps): Promise<{ list: string[] }>;
  countUsersInGroups(props: CountUsersInGroupsProps): Promise<{ total: number }>;
}
