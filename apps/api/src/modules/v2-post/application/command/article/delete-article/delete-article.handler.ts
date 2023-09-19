import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
} from '../../../../domain/domain-service/interface';

import { DeleteArticleCommand } from './delete-article.command';

@CommandHandler(DeleteArticleCommand)
export class DeleteArticleHandler implements ICommandHandler<DeleteArticleCommand, void> {
  public constructor(
    @Inject(ARTICLE_DOMAIN_SERVICE_TOKEN)
    private readonly _articleDomainService: IArticleDomainService
  ) {}

  public async execute(command: DeleteArticleCommand): Promise<void> {
    return this._articleDomainService.delete(command.payload);
  }
}
