import { ProcessScheduledContentPublishingCommand } from '@api/modules/v2-post/application/command/content';
import { ContentScheduledJobDto } from '@api/modules/v2-post/application/dto';
import { Component } from '@libs/infra/v2-queue/decorators';
import { CommandBus } from '@nestjs/cqrs';
import { Job } from 'bullmq';

import { CONTENT_SCHEDULED_PROCESSOR_TOKEN } from '../data-type/constants';
import { IProcessor } from '../interface';

@Component({ injectToken: CONTENT_SCHEDULED_PROCESSOR_TOKEN })
export class ContentProcessor implements IProcessor {
  public constructor(private readonly _commandBus: CommandBus) {}

  public async processMessage(job: Job<ContentScheduledJobDto>): Promise<void> {
    const { contentId: articleId, ownerId: articleOwnerId } = job.data;

    await this._commandBus.execute<ProcessScheduledContentPublishingCommand, void>(
      new ProcessScheduledContentPublishingCommand({ id: articleId, actorId: articleOwnerId })
    );
  }
}
