import { HEADER_REQ_ID } from '@libs/common/constants';
import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { CLS_ID, CLS_REQ, ClsServiceManager } from 'nestjs-cls';
import { Observable, catchError } from 'rxjs';
import { v4 } from 'uuid';

import { CONTEXT, IContext, SYSTEM } from './log.context';

/**
 * Used to capture exception thrown within a HTTP or microservice request
 */
@Injectable()
export class TracingInterceptor implements NestInterceptor {
  public intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const cls = ClsServiceManager.getClsService();

    if (!cls.isActive()) {
      cls.enter();
    }

    const reqType = ctx.getType();
    if (reqType !== 'http') {
      const args = ctx.switchToRpc().getContext().args;
      const data = args[0];
      const req = {
        user: data.user,
        event: args[2],
        data: data.value,
      };

      cls.set(CLS_REQ, req);
      cls.set(CLS_ID, data.headers[HEADER_REQ_ID] ?? v4());
    }

    const req = cls.get(CLS_REQ);
    const requestActor = req.user;
    const isAnonymous = !requestActor;
    const actor = isAnonymous ? { id: v4(), fullname: SYSTEM, username: SYSTEM } : requestActor;
    const eventName = (reqType === 'http' ? req.method + ' ' + req.url : req.event) ?? SYSTEM;
    const context: IContext = {
      event: eventName,
      actor,
      requestId: cls.getId(),
      handler: ctx.getHandler().name,
    };
    cls.set(CONTEXT, context);

    return next.handle().pipe(
      catchError((err) => {
        if (
          err instanceof HttpException &&
          (err.getStatus() < HttpStatus.INTERNAL_SERVER_ERROR ||
            err.getStatus() === HttpStatus.SERVICE_UNAVAILABLE)
        ) {
          throw err; // should not capture client error
        }

        new Logger(ctx.getClass().name).error(err, err.stack);

        Sentry.captureException(err);
        throw err;
      })
    );
  }
}
