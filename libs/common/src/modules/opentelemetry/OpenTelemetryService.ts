import { BeforeApplicationShutdown, Inject, Injectable } from '@nestjs/common';
import { Constants } from './Constants';
import { NodeSDK } from '@opentelemetry/sdk-node';

@Injectable()
export class OpenTelemetryService implements BeforeApplicationShutdown {
  public constructor(@Inject(Constants.SDK) private readonly sdk: NodeSDK) {}

  public async beforeApplicationShutdown() {
    await this.sdk?.shutdown();
  }
}
