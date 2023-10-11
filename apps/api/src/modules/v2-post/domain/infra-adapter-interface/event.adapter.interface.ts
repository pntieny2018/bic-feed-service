import { IEventPayload } from '@libs/infra/event';

export const EVENT_ADAPTER = 'EVENT_ADAPTER';

export interface IEventAdapter {
  publish(event: IEventPayload): void;
}
