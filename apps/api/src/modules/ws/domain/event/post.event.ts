import { WS_TARGET_TYPE, WS_ACTIVITY_VERB } from '../../data-type';

import { IEvent, IEventData } from './interface';

type PostVideoProcessedExtraData = {
  postId: string;
  status: 'successful' | 'failed';
};

export class PostVideoProcessedEventData implements IEventData {
  public verb: WS_ACTIVITY_VERB;
  public target: WS_TARGET_TYPE;
  public event: string;
  public extra: PostVideoProcessedExtraData;

  public constructor(data: PostVideoProcessedEventData) {
    Object.assign(this, data);
  }
}

export class PostVideoProcessedEvent implements IEvent {
  public rooms: string[];
  public data: PostVideoProcessedEventData;

  public constructor(payload: PostVideoProcessedEvent) {
    Object.assign(this, payload);
  }
}
