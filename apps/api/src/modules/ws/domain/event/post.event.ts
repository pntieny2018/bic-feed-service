import { TargetType, VerbActivity } from '../../data-type';

import { IEvent, IEventData } from './interface';

type PostVideoProcessedExtraData = {
  postId: string;
  status: 'successful' | 'failed';
};

export class PostVideoProcessedEventData implements IEventData {
  public verb: VerbActivity;
  public target: TargetType;
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
