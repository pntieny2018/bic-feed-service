import { WS_TARGET_TYPE, WS_ACTIVITY_VERB } from '../../../data-type';

export interface IEventData {
  event: string;
  verb: WS_ACTIVITY_VERB;
  target: WS_TARGET_TYPE;
  extra: Record<string, unknown>;
}

export interface IEvent {
  rooms: string[];
  data: IEventData;
}
