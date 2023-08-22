import { QUEUES } from '@libs/common/constants';
import { ProcessorAndLog } from '@libs/infra/log';
import { JobWithContext } from '@libs/infra/queue';
import { Process } from '@nestjs/bull';
import { CommandBus } from '@nestjs/cqrs';

import { PublishArticleCommand } from '../../application/command/article';
import { ArticleDto } from '../../application/dto';
import { ContentScheduledJobDto } from '../../application/dto/queue.dto';

@ProcessorAndLog(QUEUES.CONTENT.QUEUE_NAME)
export class ContentProcessor {
  public constructor(private readonly _commandBus: CommandBus) {}

  @Process(QUEUES.CONTENT.JOBS.PROCESS_CONTENT_SCHEDULED)
  public async handleContentScheduled(job: JobWithContext<ContentScheduledJobDto>): Promise<void> {
    const { contentId, contentOwner } = job.data.data;

    await this._commandBus.execute<PublishArticleCommand, ArticleDto>(
      new PublishArticleCommand({
        id: contentId,
        actor: contentOwner,
      })
    );
  }
}
