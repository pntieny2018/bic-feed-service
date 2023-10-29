import { TargetType, VerbActivity } from '../../data-type';

import { POST_VIDEO_HAS_BEEN_PROCESSED } from './constant';
import { IEvent, IEventPayload } from './interface';

export type PostVideoProcessedExtraData = {
  postId: string;
  status: 'successful' | 'failed';
};

export class PostVideoProcessedEventPayload implements IEventPayload {
  public verb = VerbActivity.POST;
  public target = TargetType.POST;
  public event = POST_VIDEO_HAS_BEEN_PROCESSED;
  public extra: PostVideoProcessedExtraData;

  public constructor(extra: PostVideoProcessedExtraData) {
    Object.assign(this, {
      extra: extra,
    });
  }
}

export class PostVideoProcessedEvent implements IEvent {
  public rooms: string[];
  public data: PostVideoProcessedEventPayload;

  public constructor(payload: PostVideoProcessedEvent) {
    Object.assign(this, payload);
  }
}
