import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
} from '../../../../domain/domain-service/interface';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
} from '../../../../domain/repositoty-interface';

import { ProcessScheduledArticlePublishingCommand } from './process-scheduled-article-publishing.command';

@CommandHandler(ProcessScheduledArticlePublishingCommand)
export class ProcessScheduledArticlePublishingHandler
  implements ICommandHandler<ProcessScheduledArticlePublishingCommand, void>
{
  public constructor(
    @Inject(ARTICLE_DOMAIN_SERVICE_TOKEN)
    private readonly _articleDomainService: IArticleDomainService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository
  ) {}

  public async execute(command: ProcessScheduledArticlePublishingCommand): Promise<void> {
    const { id } = command.payload;

    const articleEntity = await this._contentRepository.getContentById(id);

    try {
      await this._articleDomainService.publish(command.payload);
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
