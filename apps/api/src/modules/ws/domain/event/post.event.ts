import { TargetType, VerbActivity } from '../../data-type';

import { POST_VIDEO_HAS_BEEN_PROCESSED } from './constant';
import { IEvent, IEventData } from './interface';

type PostVideoProcessedExtraData = {
  postId: string;
  status: 'successful' | 'failed';
};

export class PostVideoProcessedEventData implements IEventData {
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
  public data: PostVideoProcessedEventData;

  public constructor(payload: PostVideoProcessedEvent) {
    Object.assign(this, payload);
  }
}
