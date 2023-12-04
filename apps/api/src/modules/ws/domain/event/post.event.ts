import { WS_TARGET_TYPE, WS_ACTIVITY_VERB } from '../../data-type';

import { IEventData } from './interface';

import { BaseEvent } from '.';

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

export class PostVideoProcessedEvent extends BaseEvent<PostVideoProcessedEventData> {}
