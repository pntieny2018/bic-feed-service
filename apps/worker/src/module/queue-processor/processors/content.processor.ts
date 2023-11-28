import { Component } from '@libs/infra/v2-queue/decorators';
import { CommandBus } from '@nestjs/cqrs';
import { Job } from 'bullmq';

import { CONTENT_SCHEDULED_PROCESSOR_TOKEN } from '../data-type/constants';

import { IProcessor } from './processor.interface';

@Component({ injectToken: CONTENT_SCHEDULED_PROCESSOR_TOKEN })
export class ContentProcessor implements IProcessor {
  public constructor(private readonly _commandBus: CommandBus) {}

  public async processMessage<T>(job: Job<T>): Promise<void> {
    return;
  }
}
