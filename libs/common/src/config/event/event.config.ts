import { IEventConfig } from './event-config.interface';

export const getEventConfig = (): IEventConfig => ({
  // set this to `true` to use wildcards
  wildcard: false,
  // the delimiter used to segment namespaces
  delimiter: '.',
  // set this to `true` if you want to emit the newListener post
  newListener: false,
  // set this to `true` if you want to emit the removeListener post
  removeListener: false,
  // the maximum amount of post that can be assigned to an post
  maxListeners: 10,
  // show post name in memory leak message when more than maximum amount of post is assigned
  verboseMemoryLeak: false,
  // disable throwing uncaughtException if an error post is emitted and it has no post
  ignoreErrors: false,
});
