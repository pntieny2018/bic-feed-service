import { Logger } from '@nestjs/common';

import { IPublisher } from '../../domain/infra-interface';

export class BasePublisher implements IPublisher {
  private readonly _logger = new Logger(BasePublisher.name);

  public add(): void {
    return;
  }
}
