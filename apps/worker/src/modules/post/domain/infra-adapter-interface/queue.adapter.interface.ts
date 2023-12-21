import { FollowAction } from '../../data-type';

export const QUEUE_ADAPTER = 'QUEUE_ADAPTER';

export type ContentScheduledJobPayload = {
  contentId: string;
  ownerId: string;
};

export type ContentChangedJobPayload = {
  contentId: string;
  newGroupIds: string[];
  oldGroupIds: string[];
  limit: number;
};

export type FollowUnfollowGroupsJobPayload = {
  groupIds: string[];
  userId: string;
  action: FollowAction;
};
export interface IQueueAdapter {
  addContentScheduledJobs(payload: ContentScheduledJobPayload[]): Promise<void>;
  addFollowUnfollowGroupsJob(payload: FollowUnfollowGroupsJobPayload): Promise<void>;
}
