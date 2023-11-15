import { Process, Processor } from '@nestjs/bull';
import { BULL_MODULE_QUEUE_PROCESS } from '@nestjs/bull/dist/bull.constants';
import { Logger } from '@nestjs/common';
import { EventsHandler, IEvent } from '@nestjs/cqrs';
import { EventPattern } from '@nestjs/microservices';
import * as Sentry from '@sentry/node';
import { CLS_ID, CLS_REQ, ClsServiceManager } from 'nestjs-cls';
import { v4 } from 'uuid';

import { HEADER_REQ_ID } from '../../../common/src/constants';
import { IEventPayload } from '../event';
import { IKafkaConsumerMessage } from '../kafka';
import { Job, JobWithContext } from '../queue';

import { CONTEXT, getContext, getDebugContext } from './log.context';

export function EventsHandlerAndLog(...events: IEvent[]) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (target: Function): void {
    const className = target.prototype.constructor.name;
    const logger = new Logger(className);

    const originalHandler = target.prototype.handle;

    function logAndExecute(event: IEventPayload): void {
      const context = getContext();
      const debugContext = getDebugContext(context);

      logger.debug(`EventHandler start: ${JSON.stringify({ debugContext })}`);

      function logDone(): void {
        logger.debug(`EventHandler done: ${JSON.stringify({ debugContext })}`);
      }
      function logError(error: any): void {
        logger.error(
          `EventHandler error: ${JSON.stringify({ debugContext, error: error.message })}`
        );
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

        function logAndExecute(job: JobWithContext<unknown>): void {
          const jobContext = job.data.context;

          const cls = ClsServiceManager.getClsService();

          cls.enter();
          cls.set(CLS_ID, jobContext.requestId);
          cls.set(CLS_REQ, { user: jobContext.actor });
          cls.set(CONTEXT, jobContext);

          const context = getContext();
          const debugContext = getDebugContext(context, methodName);
          const debugJob = getDebugJob();

          logger.debug(
            `JobProcessor start: ${JSON.stringify({
              job: debugJob,
              debugContext,
            })}`
          );

          function getDebugJob(): Job<unknown> {
            return {
              id: job.id,
              name: job.name,
              data: job.data.data,
              opts: job.opts,
              queue: { name: job.queue.name },
            };
          }

          function logDone(): void {
            logger.debug(
              `JobProcessor done: ${JSON.stringify({
                job: debugJob,
                debugContext,
              })}`
            );
          }
          function logError(error: any): void {
            logger.error(
              `JobProcessor error: ${JSON.stringify({
                job: debugJob,
                debugContext,
                error,
              })}`
            );
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

export function EventPatternAndLog(topicName: string) {
  // eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/explicit-module-boundary-types
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor): void {
    const originalHandler = descriptor.value;
    const className = target.constructor.name;
    const logger = new Logger(className);

    descriptor.value = function (message: IKafkaConsumerMessage<unknown>): void {
      const { headers } = message;
      const requestId = headers?.[HEADER_REQ_ID] || v4(); // Assuming you have a requestId header
      const cls = ClsServiceManager.getClsService();
      cls.enter();
      cls.set(CLS_ID, requestId);

      logger.debug(`EventPattern start: ${JSON.stringify({ topicName, message })}`);

      function logDone(): void {
        logger.debug(`EventPattern done: ${JSON.stringify({ topicName })}`);
      }

      function logError(error: any): void {
        logger.error(`EventPattern error: ${JSON.stringify({ topicName, error: error.message })}`);
        Sentry.captureException(error);
      }

      const result = originalHandler.call(this, message);

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
    };

    EventPattern(topicName)(target, propertyKey, descriptor);
  };
}
