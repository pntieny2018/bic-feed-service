export interface IEventPayload {
  payload: any;
  getEventName(): string;
}

export interface IEventService {
  publish(event: IEventPayload): void;
}

export const EVENT_SERVICE_TOKEN = 'EVENT_SERVICE_TOKEN';
