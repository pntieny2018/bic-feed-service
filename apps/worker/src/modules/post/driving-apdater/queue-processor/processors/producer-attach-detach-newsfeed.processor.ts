import { Component } from '@libs/infra/v2-queue/decorators';
import { JobPro } from '@libs/infra/v2-queue/shared';
import { CommandBus } from '@nestjs/cqrs';

import { ProducerAttachDetachNewsfeedCommand } from '../../../application/command/producer-attach-detach-newsfeed';
import { ProducerAttachDetachNewsfeedJobPayload } from '../../../domain/infra-adapter-interface';
import { PRODUCER_ATTACH_DETACH_NEWSFEED_PROCESSOR_TOKEN } from '../../../provider';
import { IProcessor } from '../interface';

@Component({ injectToken: PRODUCER_ATTACH_DETACH_NEWSFEED_PROCESSOR_TOKEN })
export class ProducerAttachDetachNewsfeedProcessor implements IProcessor {
  public constructor(private readonly _commandBus: CommandBus) {}

  public async processMessage(job: JobPro<ProducerAttachDetachNewsfeedJobPayload>): Promise<void> {
    return this._commandBus.execute<ProducerAttachDetachNewsfeedCommand, void>(
      new ProducerAttachDetachNewsfeedCommand(job.data)
    );
  }
}
