export type DispatchNewsfeedProps = {
  contentId: string;
  newGroupIds: string[];
  oldGroupIds: string[];
};
export interface INewsfeedDomainService {
  dispatchNewsfeed(props: DispatchNewsfeedProps): Promise<void>;
}
export const NEWSFEED_DOMAIN_SERVICE_TOKEN = 'NEWSFEED_DOMAIN_SERVICE_TOKEN';
