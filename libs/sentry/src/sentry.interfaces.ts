import { Severity } from '@sentry/node';
import { Integration, Options } from '@sentry/types';
import { ModuleMetadata, Type, ConsoleLoggerOptions } from '@nestjs/common';

export interface ISentryCloseOptions {
  enabled: boolean;
  // timeout – Maximum time in ms the client should wait until closing forcefully
  timeout?: number;
}

export type SentryModuleOptions = Omit<Options, 'integrations'> & {
  integrations?: Integration[];
  close?: ISentryCloseOptions;
} & ConsoleLoggerOptions;

export interface ISentryOptionsFactory {
  createSentryModuleOptions(): Promise<SentryModuleOptions> | SentryModuleOptions;
}

export interface ISentryModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  useClass?: Type<ISentryOptionsFactory>;
  useExisting?: Type<ISentryOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<SentryModuleOptions> | SentryModuleOptions;
}

export type SentryTransaction = boolean | 'path' | 'methodPath' | 'handler';

export interface ISentryFilterFunction {
  (exception: any): boolean;
}

export interface ISentryInterceptorOptionsFilter {
  type: any;
  filter?: ISentryFilterFunction;
}

export interface ISentryInterceptorOptions {
  filters?: ISentryInterceptorOptionsFilter[];
  tags?: { [key: string]: string };
  extra?: { [key: string]: any };
  fingerprint?: string[];
  level?: Severity;
  request?: boolean;
  serverName?: boolean;
  transaction?: boolean | 'path' | 'methodPath' | 'handler';
  user?: boolean | string[];
  version?: boolean;
}
