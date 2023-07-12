import { Inject } from '@nestjs/common';
import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
  IContentDomainService,
} from '../../../domain/domain-service/interface';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ProcessArticleScheduledCommand,
  ProcessArticleScheduledCommandPayload,
} from './process-article-scheduled.command';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { IPaginatedInfo } from 'apps/api/src/common/dto';

@CommandHandler(ProcessArticleScheduledCommand)
export class ProcessArticleScheduledHandler
  implements ICommandHandler<ProcessArticleScheduledCommand, void>
{
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(ARTICLE_DOMAIN_SERVICE_TOKEN)
    private readonly _articleDomainService: IArticleDomainService,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService
  ) {}

  public async execute(command: ProcessArticleScheduledCommand): Promise<void> {
    return;
  }

  private async _recursivelyArticleScheduled(
    payload: ProcessArticleScheduledCommandPayload,
    meta: IPaginatedInfo
  ): Promise<void> {
    const { hasNextPage, endCursor } = meta;
  }
}
