import { ControllerInjector } from './Trace/Injectors/ControllerInjector';
import { GuardInjector } from './Trace/Injectors/GuardInjector';
import { EventEmitterInjector } from './Trace/Injectors/EventEmitterInjector';
import { ScheduleInjector } from './Trace/Injectors/ScheduleInjector';
import { PipeInjector } from './Trace/Injectors/PipeInjector';
import { ConsoleLoggerInjector } from './Trace/Injectors/ConsoleLoggerInjector';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { Resource } from '@opentelemetry/resources';
import { NoopSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { CompositePropagator } from '@opentelemetry/core';
import { JaegerPropagator } from '@opentelemetry/propagator-jaeger';
import { B3InjectEncoding, B3Propagator } from '@opentelemetry/propagator-b3';
import {
  InstrumentationConfigMap,
  getNodeAutoInstrumentations,
} from '@opentelemetry/auto-instrumentations-node';
import { containerDetector } from '@opentelemetry/resource-detector-container';

import { Span } from '@opentelemetry/api';
import { ClientRequest, IncomingMessage } from 'http';
import { OpenTelemetryModuleConfig } from './OpenTelemetryModuleConfig.interface';
import { SequelizeInstrumentation } from 'opentelemetry-instrumentation-sequelize';

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
      if (request instanceof ClientRequest) {
        span.updateName(`${request.method} ${request.path}`);
      }
      if (request instanceof IncomingMessage) {
        span.updateName(`${request.method} ${request.url}`);
      }
    },
    enabled: true,
    //ignoreIncomingPaths: ['/health', '/_health', '/healthz', 'healthcheck'],
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
