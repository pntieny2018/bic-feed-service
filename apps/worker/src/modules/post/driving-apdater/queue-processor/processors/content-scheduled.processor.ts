import { ProcessScheduledContentPublishingCommand } from '@api/modules/v2-post/application/command/content';
import { ContentScheduledJobDto } from '@api/modules/v2-post/application/dto';
import { Component } from '@libs/infra/v2-queue/decorators';
import { JobPro } from '@libs/infra/v2-queue/shared';
import { CommandBus } from '@nestjs/cqrs';

import { CONTENT_SCHEDULED_PROCESSOR_TOKEN } from '../../../provider';
import { IProcessor } from '../interface';

/**
 * TODO: Move commands to worker folder
 */
@Component({ injectToken: CONTENT_SCHEDULED_PROCESSOR_TOKEN })
export class ContentScheduledProcessor implements IProcessor {
  public constructor(private readonly _commandBus: CommandBus) {}

  public async processMessage(job: JobPro<ContentScheduledJobDto>): Promise<void> {
    const { contentId: articleId, ownerId: articleOwnerId } = job.data;

    await this._commandBus.execute<ProcessScheduledContentPublishingCommand, void>(
      new ProcessScheduledContentPublishingCommand({ id: articleId, actorId: articleOwnerId })
    );
  }
}
