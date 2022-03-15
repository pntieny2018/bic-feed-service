import { SentryService } from './sentry.service';
import { SENTRY_MODULE_OPTIONS, SENTRY_TOKEN } from './sentry.constants';
import { DynamicModule, Global, Module, Provider, Type } from '@nestjs/common';
import {
  ISentryModuleAsyncOptions,
  ISentryOptionsFactory,
  SentryModuleOptions,
} from './sentry.interfaces';

@Global()
@Module({})
export class SentryModule {
  public static forRootAsync(options: ISentryModuleAsyncOptions): DynamicModule {
    const provider: Provider = {
      inject: [SENTRY_MODULE_OPTIONS],
      provide: SENTRY_TOKEN,
      useFactory: (options: SentryModuleOptions) => new SentryService(options),
    };

    return {
      exports: [provider, SentryService],
      imports: options.imports,
      module: SentryModule,
      providers: [...this._createAsyncProviders(options), provider, SentryService],
    };
  }

  private static _createAsyncProviders(options: ISentryModuleAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this._createAsyncOptionsProvider(options)];
    }
    const useClass = options.useClass as Type<ISentryOptionsFactory>;
    return [
      this._createAsyncOptionsProvider(options),
      {
        provide: useClass,
        useClass,
      },
    ];
  }

  private static _createAsyncOptionsProvider(options: ISentryModuleAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        inject: options.inject || [],
        provide: SENTRY_MODULE_OPTIONS,
        useFactory: options.useFactory,
      };
    }
    const inject = [(options.useClass || options.useExisting) as Type<ISentryOptionsFactory>];
    return {
      provide: SENTRY_MODULE_OPTIONS,
      useFactory: async (optionsFactory: ISentryOptionsFactory) =>
        await optionsFactory.createSentryModuleOptions(),
      inject,
    };
  }
}
