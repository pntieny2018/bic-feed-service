import { QUEUES } from '@libs/common/constants';
import { ProcessorAndLog } from '@libs/infra/log';
import { JobWithContext } from '@libs/infra/queue';
import { Process } from '@nestjs/bull';
import { CommandBus } from '@nestjs/cqrs';

import { ProcessScheduledArticlePublishingCommand } from '../../application/command/article/process-scheduled-article-publishing';
import { ArticleScheduledJobDto } from '../../application/dto/queue.dto';

@ProcessorAndLog(QUEUES.ARTICLE_SCHEDULED.QUEUE_NAME)
export class ArticleProcessor {
  public constructor(private readonly _commandBus: CommandBus) {}

  @Process(QUEUES.ARTICLE_SCHEDULED.JOBS.PROCESS_ARTICLE_SCHEDULED)
  public async handleArticleScheduled(job: JobWithContext<ArticleScheduledJobDto>): Promise<void> {
    const { articleId, articleOwner } = job.data.data;

    await this._commandBus.execute<ProcessScheduledArticlePublishingCommand, void>(
      new ProcessScheduledArticlePublishingCommand({ id: articleId, actor: articleOwner })
    );
  }
}
