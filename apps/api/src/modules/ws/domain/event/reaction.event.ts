import { WS_TARGET_TYPE, WS_ACTIVITY_VERB } from '../../data-type';

import { IEventData } from './interface';

import { BaseEvent } from '.';

export class ReactionEventData implements IEventData {
  public verb: WS_ACTIVITY_VERB;
  public target: WS_TARGET_TYPE;
  public event: string;
  public extra: Record<string, unknown>;

  public constructor(payload: ReactionEventData) {
    Object.assign(this, payload);
  }
}

export class ReactionEvent extends BaseEvent<ReactionEventData> {}
