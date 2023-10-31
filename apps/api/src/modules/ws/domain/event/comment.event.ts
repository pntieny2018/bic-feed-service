import { TargetType, VerbActivity } from '../../data-type';

import { IEvent, IEventData } from './interface';

export class CommentCreatedEventData implements IEventData {
  public verb: VerbActivity;
  public target: TargetType;
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
