export interface IEvent<T> {
  payload: T;
  getEventName: () => string;
}
