import { Inject } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
} from '../../../../domain/repositoty-interface';
import { ArticleDto } from '../../../dto';
import { PublishArticleCommand } from '../publish-article';

import { ProcessScheduledArticlePublishingCommand } from './process-scheduled-article-publishing.command';

@CommandHandler(ProcessScheduledArticlePublishingCommand)
export class ProcessScheduledArticlePublishingHandler
  implements ICommandHandler<ProcessScheduledArticlePublishingCommand, void>
{
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    private readonly _commandBus: CommandBus
  ) {}

  public async execute(command: ProcessScheduledArticlePublishingCommand): Promise<void> {
    const { id, actor } = command.payload;

    const articleEntity = await this._contentRepository.getContentById(id);

    try {
      await this._commandBus.execute<PublishArticleCommand, ArticleDto>(
        new PublishArticleCommand({ id, actor })
      );
    } catch (error) {
      articleEntity.setScheduleFailed();
      articleEntity.setErrorLog({
        message: error.message,
        code: error.code,
        stack: JSON.stringify(error.stack),
      });
      await this._contentRepository.update(articleEntity);
    }
  }
}
