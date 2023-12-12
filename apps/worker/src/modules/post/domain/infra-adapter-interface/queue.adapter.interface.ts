export const QUEUE_ADAPTER = 'QUEUE_ADAPTER';

export type ContentScheduledJobPayload = {
  contentId: string;
  ownerId: string;
};

export interface IQueueAdapter {
  addContentScheduledJobs(payload: ContentScheduledJobPayload[]): Promise<void>;
}
