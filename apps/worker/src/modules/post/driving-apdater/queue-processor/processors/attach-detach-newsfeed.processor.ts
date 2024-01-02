import { Component } from '@libs/infra/v2-queue/decorators';
import { JobPro } from '@libs/infra/v2-queue/shared';
import { CommandBus } from '@nestjs/cqrs';

import { AttachDetachContentNewsfeedCommand } from '../../../application/command/attach-detach-content-newsfeed';
import { AttachDetachNewsfeedJobPayload } from '../../../domain/infra-adapter-interface';
import { ATTACH_DETACH_NEWSFEED_PROCESSOR_TOKEN } from '../../../provider';
import { IProcessor } from '../interface';

@Component({ injectToken: ATTACH_DETACH_NEWSFEED_PROCESSOR_TOKEN })
export class AttachDetachNewsfeedProcessor implements IProcessor {
  public constructor(private readonly _commandBus: CommandBus) {}

  public async processMessage(job: JobPro<AttachDetachNewsfeedJobPayload>): Promise<void> {
    return this._commandBus.execute<AttachDetachContentNewsfeedCommand, void>(
      new AttachDetachContentNewsfeedCommand(job.data)
    );
  }
}
