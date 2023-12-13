import { VERSIONS_SUPPORTED } from '@api/common/constants';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import {
  envDetector,
  hostDetector,
  osDetector,
  processDetector,
  Resource,
} from '@opentelemetry/resources';
import { BatchSpanProcessor, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { SequelizeInstrumentation } from 'opentelemetry-instrumentation-sequelize';
import { NodeSDK } from '@opentelemetry/sdk-node';

const traceExporter = new OTLPTraceExporter({
  url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
});

export const tracing = new NodeSDK({
  spanProcessor: new SimpleSpanProcessor(traceExporter),
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'test 100',
    [SemanticResourceAttributes.SERVICE_VERSION]: VERSIONS_SUPPORTED[VERSIONS_SUPPORTED.length - 1],
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.APP_ENV,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
      '@opentelemetry/instrumentation-net': {
        enabled: false,
      },
      '@opentelemetry/instrumentation-dns': {
        enabled: false,
      },
    }),
    new SequelizeInstrumentation(),
  ],
});

process.on('SIGTERM', () => {
  tracing
    .shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
