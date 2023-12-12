export type DispatchContentsInGroupsToUserIdProps = {
  groupIds: string[];
  userId: string;
  action: 'publish' | 'remove';
};
export interface INewsfeedDomainService {
  dispatchContentsInGroupsToUserId(input: DispatchContentsInGroupsToUserIdProps): Promise<void>;
}
export const NEWSFEED_DOMAIN_SERVICE_TOKEN = 'NEWSFEED_DOMAIN_SERVICE_TOKEN';
