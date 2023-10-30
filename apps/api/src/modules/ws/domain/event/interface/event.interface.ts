import { TargetType, VerbActivity } from '../../../data-type';

export interface IEventData {
  event: string;
  verb: VerbActivity;
  target: TargetType;
  extra: Record<string, unknown>;
}

export interface IEvent {
  rooms: string[];
  data: IEventData;
}
