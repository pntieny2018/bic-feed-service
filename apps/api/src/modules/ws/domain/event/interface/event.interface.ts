import { TargetType, VerbActivity } from '../../../data-type';

export interface IEventPayload {
  event: string;
  verb: VerbActivity;
  target: TargetType;
  extra: Record<string, unknown>;
}

export interface IEvent {
  rooms: string[];
  data: IEventPayload;
}
