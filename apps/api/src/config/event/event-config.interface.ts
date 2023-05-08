export interface IEventConfig {
  wildcard: boolean;
  delimiter: string;
  newListener: boolean;
  removeListener: boolean;
  maxListeners: number;
  verboseMemoryLeak: boolean;
  ignoreErrors: boolean;
}
