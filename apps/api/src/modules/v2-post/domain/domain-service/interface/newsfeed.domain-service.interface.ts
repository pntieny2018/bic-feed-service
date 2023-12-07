export type DispatchContentIdToGroupsProps = {
  contentId: string;
  newGroupIds: string[];
  oldGroupIds: string[];
};
export type DispatchContentsInGroupsToUserIdProps = {
  groupIds: string[];
  userId: string;
  action: 'publish' | 'remove';
};
export interface INewsfeedDomainService {
  dispatchContentIdToGroups(props: DispatchContentIdToGroupsProps): Promise<void>;
  dispatchContentsInGroupsToUserId(input: DispatchContentsInGroupsToUserIdProps): Promise<void>;
}
export const NEWSFEED_DOMAIN_SERVICE_TOKEN = 'NEWSFEED_DOMAIN_SERVICE_TOKEN';
