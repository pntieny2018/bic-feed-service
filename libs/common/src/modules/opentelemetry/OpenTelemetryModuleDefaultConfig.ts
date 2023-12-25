import { ClientRequest, IncomingMessage } from 'http';

import { Span } from '@opentelemetry/api';
import {
  InstrumentationConfigMap,
  getNodeAutoInstrumentations,
} from '@opentelemetry/auto-instrumentations-node';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { CompositePropagator } from '@opentelemetry/core';
import { B3InjectEncoding, B3Propagator } from '@opentelemetry/propagator-b3';
import { JaegerPropagator } from '@opentelemetry/propagator-jaeger';
import { containerDetector } from '@opentelemetry/resource-detector-container';
import { Resource } from '@opentelemetry/resources';
import { NoopSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { SequelizeInstrumentation } from 'opentelemetry-instrumentation-sequelize';

import { OpenTelemetryModuleConfig } from './OpenTelemetryModuleConfig.interface';
import { ConsoleLoggerInjector } from './Trace/Injectors/ConsoleLoggerInjector';
import { ControllerInjector } from './Trace/Injectors/ControllerInjector';
import { EventEmitterInjector } from './Trace/Injectors/EventEmitterInjector';
import { GuardInjector } from './Trace/Injectors/GuardInjector';
import { PipeInjector } from './Trace/Injectors/PipeInjector';
import { ScheduleInjector } from './Trace/Injectors/ScheduleInjector';

export const NodeAutoInstrumentationsDefaultConfig = <InstrumentationConfigMap>{
  '@opentelemetry/instrumentation-fs': {
    requireParentSpan: true,
    enabled: true,
    createHook: (funtionName, { args }) => {
      // Ignore node_modules
      return !args[0].toString().indexOf('node_modules');
    },
    endHook: (funtionName, { args, span }) => {
      span.setAttribute('file', args[0].toString());
    },
  },
  '@opentelemetry/instrumentation-http': {
    requireParentforOutgoingSpans: true,
    requestHook: (span: Span, request) => {
      // replace uuid v4 to :id in path
      const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

      if (request instanceof ClientRequest) {
        span.updateName(`${request.method} ${request.path.replace(uuidRegex, ':id')}`);
      }
      if (request instanceof IncomingMessage) {
        span.updateName(`${request.method} ${request.url.replace(uuidRegex, ':id')}`);
      }
    },
    enabled: true,
    ignoreIncomingPaths: ['/health/readyz', '/health/livez'],
  },
  '@opentelemetry/instrumentation-net': {
    enabled: false,
  },
  '@opentelemetry/instrumentation-dns': {
    enabled: false,
  },
  '@opentelemetry/instrumentation-graphql': {
    enabled: false,
    mergeItems: true,
    ignoreTrivialResolveSpans: true,
    depth: 2,
  },
  '@opentelemetry/instrumentation-express': {
    enabled: false,
  },
};

export const OpenTelemetryModuleDefaultConfig = <OpenTelemetryModuleConfig>{
  serviceName: 'UNKNOWN',
  traceAutoInjectors: [
    ControllerInjector,
    GuardInjector,
    EventEmitterInjector,
    ScheduleInjector,
    PipeInjector,
    ConsoleLoggerInjector,
  ],
  autoDetectResources: false,
  resourceDetectors: [containerDetector],
  contextManager: new AsyncLocalStorageContextManager(),
  resource: new Resource({
    lib: '@overbit/opentelemetry-nestjs',
  }),
  instrumentations: [
    getNodeAutoInstrumentations(NodeAutoInstrumentationsDefaultConfig),
    new SequelizeInstrumentation(),
  ],
  spanProcessor: new NoopSpanProcessor(),
  textMapPropagator: new CompositePropagator({
    propagators: [
      new JaegerPropagator(),
      new B3Propagator(),
      new B3Propagator({
        injectEncoding: B3InjectEncoding.MULTI_HEADER,
      }),
    ],
  }),
};
