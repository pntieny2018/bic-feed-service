import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { registerInstrumentations } from '@opentelemetry/instrumentation';

// instrumentation libraries
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ExpressInstrumentation } from 'opentelemetry-instrumentation-express';
import { SequelizeInstrumentation } from 'opentelemetry-instrumentation-sequelize';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';

const provider = new NodeTracerProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'test 666',
  }),
});

provider.register();
provider.addSpanProcessor(
  new BatchSpanProcessor(
    new OTLPTraceExporter({
      url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
    })
  )
);

registerInstrumentations({
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
      '@opentelemetry/instrumentation-express': {
        enabled: false,
      },
    }),
    new ExpressInstrumentation(),
    new SequelizeInstrumentation(),
    new HttpInstrumentation({
      requestHook: (span, request) => {
        console.log('requestHook', request);
        span.setAttribute('custom request hook attribute', 'request');
      },
    }),
  ],
});
