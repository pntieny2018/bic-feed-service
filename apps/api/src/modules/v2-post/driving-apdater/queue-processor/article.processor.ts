import { QUEUES } from '@libs/common/constants';
import { ProcessorAndLog } from '@libs/infra/log';
import { JobWithContext } from '@libs/infra/queue';
import { Process } from '@nestjs/bull';
import { CommandBus } from '@nestjs/cqrs';

import { ProcessScheduledContentPublishingCommand } from '../../application/command/content/process-scheduled-content-publishing';
import { ContentScheduledJobDto } from '../../application/dto/queue.dto';

@ProcessorAndLog(QUEUES.CONTENT_SCHEDULED.QUEUE_NAME)
export class ArticleProcessor {
  public constructor(private readonly _commandBus: CommandBus) {}

  @Process(QUEUES.CONTENT_SCHEDULED.JOBS.PROCESS_CONTENT_SCHEDULED)
  public async handleArticleScheduled(job: JobWithContext<ContentScheduledJobDto>): Promise<void> {
    const { contentId: articleId, ownerId: articleOwnerId } = job.data.data;

    await this._commandBus.execute<ProcessScheduledContentPublishingCommand, void>(
      new ProcessScheduledContentPublishingCommand({ id: articleId, actorId: articleOwnerId })
    );
  }
}
