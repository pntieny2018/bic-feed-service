import { Component } from '@libs/infra/v2-queue/decorators';
import { JobPro } from '@libs/infra/v2-queue/shared';
import { CommandBus } from '@nestjs/cqrs';

import { AttachDetachContentNewsfeedCommand } from '../../../application/command/attach-detach-content-newsfeed';
import { PublishOrRemoveContentJobPayload } from '../../../domain/infra-adapter-interface';
import { PUBLISH_REMOVE_CONTENT_PROCESSOR_TOKEN } from '../../../provider';
import { IProcessor } from '../interface';

@Component({ injectToken: PUBLISH_REMOVE_CONTENT_PROCESSOR_TOKEN })
export class PublishRemoveContentProcessor implements IProcessor {
  public constructor(private readonly _commandBus: CommandBus) {}

  public async processMessage(job: JobPro<PublishOrRemoveContentJobPayload>): Promise<void> {
    await this._commandBus.execute<AttachDetachContentNewsfeedCommand, void>(
      new AttachDetachContentNewsfeedCommand(job.data)
    );
  }
}
