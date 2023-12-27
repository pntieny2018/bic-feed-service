import { FollowAction, NewsfeedAction } from '../../data-type';
import { ContentNewsFeedAttributes } from '../repositoty-interface';

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
  content: ContentNewsFeedAttributes;
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
  addFollowUnfollowGroupsJobs(payloads: FollowUnfollowGroupsJobPayload[]): Promise<void>;
  addAttachDetachNewsfeedJobs(payloads: AttachDetachNewsfeedJobPayload[]): Promise<void>;
  addProducerFollowUnfollowJob(payload: ProducerFollowUnfollowJobPayload): Promise<void>;
}
