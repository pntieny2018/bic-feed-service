/* eslint-disable no-console */
import { HEADER_REQ_ID, IS_LOCAL } from '@libs/common/constants';
import { Global, Module } from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger, LoggerModule } from 'nestjs-pino';

@Global()
@Module({
  imports: [
    LoggerModule.forRootAsync({
      useFactory: () => {
        let reqId;
        return {
          forRoutes: ['*'],
          pinoHttp: {
            level: 'debug',
            serializers: {
              req: (req: Request): any => {
                reqId = req.headers[HEADER_REQ_ID];
                return {
                  method: req.method,
                  url: req.url,
                  query: req.query,
                  params: req.params,
                  body: req.body,
                  headers: {
                    [HEADER_REQ_ID]: req.headers[HEADER_REQ_ID],
                  },
                };
              },
              res: (res: Response): any => ({
                statusCode: res.statusCode,
              }),
              time: (time: number): any => ({
                timestamp: new Date(time).toISOString(),
              }),
            },
            timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
            errorKey: 'error',
            formatters: {
              level: (label: string): any => ({ level: label }),
              bindings: () => ({}),
              log: (object: any): any => {
                const { res, context, responseTime, error, err, ...loggedObject } = object;
                const loggedError = error ?? err;
                const logFormat = {
                  res,
                  context,
                  error: loggedError,
                  object: loggedObject,
                  request_id: reqId,
                  response_time: responseTime ? `+${responseTime}ms` : undefined,
                };

                if (loggedObject.msg || loggedError?.message) {
                  logFormat['msg'] = loggedObject.msg || loggedError?.message;
                }

                return logFormat;
              },
            },
          },
        };
      },
    }),
  ],
})
export class LogModule {
  public constructor(private logger: Logger) {
    if (!IS_LOCAL) {
      console.log = (args) => logger.log(args);
      console.warn = (args) => logger.warn(args);
      console.error = (args) => logger.error(args);
    }
  }
}
