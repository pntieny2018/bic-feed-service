import { WS_TARGET_TYPE, WS_ACTIVITY_VERB } from '../../data-type';

import { IEvent, IEventData } from './interface';

export class ReactionEventData implements IEventData {
  public verb: WS_ACTIVITY_VERB;
  public target: WS_TARGET_TYPE;
  public event: string;
  public extra: Record<string, unknown>;

  public constructor(payload: ReactionEventData) {
    Object.assign(this, payload);
  }
}

export class ReactionEvent implements IEvent {
  public rooms: string[];
  public data: ReactionEventData;

  public constructor(payload: ReactionEvent) {
    Object.assign(this, payload);
  }
}
