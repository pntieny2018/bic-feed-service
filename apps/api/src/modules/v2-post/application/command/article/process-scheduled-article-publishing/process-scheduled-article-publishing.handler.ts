import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { DomainNotFoundException } from '../../../../../../common/exceptions';
import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
} from '../../../../domain/domain-service/interface';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
} from '../../../../domain/repositoty-interface';
import { IUserAdapter, USER_ADAPTER } from '../../../../domain/service-adapter-interface';

import { ProcessScheduledArticlePublishingCommand } from './process-scheduled-article-publishing.command';

@CommandHandler(ProcessScheduledArticlePublishingCommand)
export class ProcessScheduledArticlePublishingHandler
  implements ICommandHandler<ProcessScheduledArticlePublishingCommand, void>
{
  public constructor(
    @Inject(ARTICLE_DOMAIN_SERVICE_TOKEN)
    private readonly _articleDomainService: IArticleDomainService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter
  ) {}

  public async execute(command: ProcessScheduledArticlePublishingCommand): Promise<void> {
    const { id, actorId } = command.payload;

    const articleEntity = await this._contentRepository.getContentById(id);
    const actor = await this._userAdapter.getUserById(actorId);
    if (!actor) {
      throw new DomainNotFoundException('User not found');
    }

    try {
      await this._articleDomainService.publish({ id, actor });
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
