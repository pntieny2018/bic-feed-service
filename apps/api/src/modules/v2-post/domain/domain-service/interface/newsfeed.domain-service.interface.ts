export type DispatchContentIdToGroupsProps = {
  contentId: string;
  newGroupIds: string[];
  oldGroupIds: string[];
};

export interface INewsfeedDomainService {
  dispatchContentIdToGroups(props: DispatchContentIdToGroupsProps): Promise<void>;
}
export const NEWSFEED_DOMAIN_SERVICE_TOKEN = 'NEWSFEED_DOMAIN_SERVICE_TOKEN';
