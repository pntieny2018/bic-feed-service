import { SpanExporter } from '@opentelemetry/sdk-trace-base';

export class NoopTraceExporter implements SpanExporter {
  public export() {
    // noop
  }

  public shutdown(): Promise<void> {
    return Promise.resolve(undefined);
  }
}
