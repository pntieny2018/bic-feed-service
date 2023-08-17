import { Process, Processor } from '@nestjs/bull';
import { BULL_MODULE_QUEUE_PROCESS } from '@nestjs/bull/dist/bull.constants';
import { Logger } from '@nestjs/common';
import { EventsHandler, IEvent } from '@nestjs/cqrs';
import * as Sentry from '@sentry/node';

import { IEventPayload } from '../event';
import { Job } from '../queue';

import { getContext, getDebugContext } from './log.context';

export function EventsHandlerAndLog(...events: IEvent[]) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (target: Function): void {
    const className = target.prototype.constructor.name;
    const logger = new Logger(className);

    const originalHandler = target.prototype.handle;

    function logAndExecute(event: IEventPayload): void {
      const context = getContext();
      const debugContext = getDebugContext(context);

      logger.debug(`EventHandler start: ${JSON.stringify({ event, debugContext })}`);

      function logDone(): void {
        logger.debug(`EventHandler done: ${JSON.stringify({ event, debugContext })}`);
      }
      function logError(error: any): void {
        logger.error(`EventHandler error: ${JSON.stringify({ event, debugContext, error })}`);
        Sentry.captureException(error);
      }

      const result = originalHandler.call(this, event);

      if (result instanceof Promise) {
        result
          .then((d) => {
            logDone();
            return d;
          })
          .catch((error) => {
            logError(error);
          });
      } else {
        logDone();
      }
    }

    target.prototype.handle = logAndExecute;

    EventsHandler(...events)(target);
  };
}

export function ProcessorAndLog(queueName: string) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (target: Function): void {
    const methodNames = Object.getOwnPropertyNames(target.prototype);
    const className = target.prototype.constructor.name;
    const logger = new Logger(className);

    methodNames.forEach((methodName) => {
      const metadataKeys = Reflect.getMetadataKeys(target.prototype[methodName]);

      if (metadataKeys.includes(BULL_MODULE_QUEUE_PROCESS)) {
        const jobName = Reflect.getMetadata(
          BULL_MODULE_QUEUE_PROCESS,
          target.prototype[methodName]
        );
        const originalDescriptor = Object.getOwnPropertyDescriptor(target.prototype, methodName);

        const originalMethod = originalDescriptor.value;

        function logAndExecute(job: Job<unknown>): void {
          const context = getContext();
          const debugContext = getDebugContext(context, methodName);

          logger.debug(`JobProcessor start: ${JSON.stringify({ job, debugContext })}`);

          function logDone(): void {
            logger.debug(`JobProcessor done: ${JSON.stringify({ job, debugContext })}`);
          }
          function logError(error: any): void {
            logger.error(`JobProcessor error: ${JSON.stringify({ job, debugContext, error })}`);
            Sentry.captureException(error);
          }

          const result = originalMethod.call(this, job);

          if (result instanceof Promise) {
            result
              .then((d) => {
                logDone();
                return d;
              })
              .catch((error) => {
                logError(error);
              });
          } else {
            logDone();
          }

          return result;
        }

        target.prototype[methodName] = logAndExecute;

        const extendedDescriptor = Object.getOwnPropertyDescriptor(target.prototype, methodName);
        Process(jobName.name)(target, methodName, extendedDescriptor);
      }
    });

    Processor(queueName)(target);
  };
}
