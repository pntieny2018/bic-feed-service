import { WS_TARGET_TYPE, WS_ACTIVITY_VERB } from '../../data-type';

import { IEvent, IEventData } from './interface';

export class CommentCreatedEventData implements IEventData {
  public verb: WS_ACTIVITY_VERB;
  public target: WS_TARGET_TYPE;
  public event: string;
  public extra: Record<string, unknown>;

  public constructor(payload: CommentCreatedEventData) {
    Object.assign(this, payload);
  }
}

export class CommentCreatedEvent implements IEvent {
  public rooms: string[];
  public data: CommentCreatedEventData;

  public constructor(payload: CommentCreatedEvent) {
    Object.assign(this, payload);
  }
}
