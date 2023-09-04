export interface IEventPayload {
  payload: any;
}

export interface IEventService {
  publish(event: IEventPayload): void;
}

export const EVENT_SERVICE_TOKEN = 'EVENT_SERVICE_TOKEN';
