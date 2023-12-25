import { FollowAction, NewsfeedAction } from '../../data-type';

export const QUEUE_ADAPTER = 'QUEUE_ADAPTER';

export type ContentScheduledJobPayload = {
  contentId: string;
  ownerId: string;
};

export type ProducerAttachDetachNewsfeedJobPayload = {
  contentId: string;
  newGroupIds: string[];
  oldGroupIds: string[];
};

export type AttachDetachNewsfeedJobPayload = {
  queryParams: {
    notInGroupIds: string[];
    groupIds: string[];
    offset: number;
    limit: number;
  };
  contentId: string;
  action: NewsfeedAction;
};

export type ProducerFollowUnfollowJobPayload = {
  groupIds: string[];
  userId: string;
  action: FollowAction;
};

export type FollowUnfollowGroupsJobPayload = {
  queryParams: {
    notInGroupIds?: string[];
    groupIds: string[];
    offset: number;
    limit: number;
  };
  userId: string;
  action: FollowAction;
};

export interface IQueueAdapter {
  addContentScheduledJobs(payload: ContentScheduledJobPayload[]): Promise<void>;
  addFollowUnfollowGroupsJob(payload: FollowUnfollowGroupsJobPayload): Promise<void>;
  addAttachDetachNewsfeedJob(payload: AttachDetachNewsfeedJobPayload): Promise<void>;
  addProducerFollowUnfollowJob(payload: ProducerFollowUnfollowJobPayload): Promise<void>;
}
