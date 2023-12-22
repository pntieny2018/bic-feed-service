import { Component } from '@libs/infra/v2-queue/decorators';
import { JobPro } from '@libs/infra/v2-queue/shared';
import { CommandBus } from '@nestjs/cqrs';

import { AttachDetachContentNewsfeedCommand } from '../../../application/command/attach-detach-content-newsfeed';
import { ContentChangedJobPayload } from '../../../domain/infra-adapter-interface';
import { CONTENT_CHANGED_PROCESSOR_TOKEN } from '../../../provider';
import { IProcessor } from '../interface';

@Component({ injectToken: CONTENT_CHANGED_PROCESSOR_TOKEN })
export class ContentChangedProcessor implements IProcessor {
  public constructor(private readonly _commandBus: CommandBus) {}

  public async processMessage(job: JobPro<ContentChangedJobPayload>): Promise<void> {
    return this._commandBus.execute<AttachDetachContentNewsfeedCommand, void>(
      new AttachDetachContentNewsfeedCommand(job.data)
    );
  }
}
