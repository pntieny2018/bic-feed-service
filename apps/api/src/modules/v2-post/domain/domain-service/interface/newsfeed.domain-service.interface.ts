import { CONTENT_TYPE } from '@beincom/constants';
import { CursorPaginationProps, CursorPaginationResult } from '@libs/database/postgres/common';

import { ContentEntity } from '../../model/content';

export type DispatchContentIdToGroupsProps = {
  contentId: string;
  newGroupIds: string[];
  oldGroupIds: string[];
};

export type GetContentIdsInNewsFeedProps = {
  authUserId: string;
  isImportant?: boolean;
  isMine?: boolean;
  isSaved?: boolean;
  type?: CONTENT_TYPE;
} & CursorPaginationProps;

export interface INewsfeedDomainService {
  dispatchContentIdToGroups(props: DispatchContentIdToGroupsProps): Promise<void>;
  attachContentToUserId(contentEntity: ContentEntity, userId: string): Promise<void>;
  getContentIdsInNewsFeed(
    getContentIdsInNewsFeedProps: GetContentIdsInNewsFeedProps
  ): Promise<CursorPaginationResult<string>>;
}
export const NEWSFEED_DOMAIN_SERVICE_TOKEN = 'NEWSFEED_DOMAIN_SERVICE_TOKEN';
