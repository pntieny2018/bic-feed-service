export const POST_EVENT_APPLICATION_SERVICE = 'POST_EVENT_APPLICATION_SERVICE';

export type PostVideoProcessedEventPayload = {
  event: string;
  recipients: string[];
  postId: string;
  status: 'successful' | 'failed';
};

export interface IPostEventApplicationService {
  emitPostVideoProcessedEvent(payload: PostVideoProcessedEventPayload): Promise<void>;
}
