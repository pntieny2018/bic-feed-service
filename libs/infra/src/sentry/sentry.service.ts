import { Inject, Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Client, Event } from '@sentry/types';
import * as SourceMap from 'source-map-support';

import { SENTRY_MODULE_OPTIONS } from './sentry.constants';
import { SentryModuleOptions } from './sentry.interfaces';

@Injectable()
export class SentryService implements OnApplicationShutdown {
  private _logger = new Logger(SentryService.name);

  public constructor(
    @Inject(SENTRY_MODULE_OPTIONS)
    private readonly _opts?: SentryModuleOptions
  ) {
    if (!(_opts && _opts.dsn)) {
      return;
    }
    const { debug: isDebug, integrations = [], ...sentryOptions } = _opts;
    SourceMap.install();
    Sentry.init({
      ...sentryOptions,
      debug: isDebug,
      integrations: [
        ...integrations,
        new Sentry.Integrations.OnUncaughtException({
          onFatalError: async (err): Promise<void> => {
            if (err.name === 'SentryError') {
              this._logger.error(JSON.stringify(err?.stack));
            } else {
              (Sentry.getCurrentHub().getClient<Client>() as Client).captureException(err);
              process.exit(1);
            }
          },
        }),
        new Sentry.Integrations.OnUnhandledRejection({ mode: 'warn' }),
      ],
    });
  }

  public captureMessage(message: string, type: Sentry.Severity): void {
    if (this._opts.enabled) {
      Sentry.captureMessage(message, type);
    }
  }

  public captureException(ex: Error): void {
    if (this._opts.enabled) {
      Sentry.captureException(ex);
    }
  }

  public captureEvent(event: Event): void {
    if (this._opts.enabled) {
      Sentry.captureEvent(event);
    }
  }

  public async onApplicationShutdown(signal?: string): Promise<void> {
    if (this._opts?.close?.enabled === true) {
      this._logger.warn(`sentry service close with signal: ${signal ?? 'unknown'}`);
      await Sentry.close(this._opts?.close.timeout);
    }
  }
}
