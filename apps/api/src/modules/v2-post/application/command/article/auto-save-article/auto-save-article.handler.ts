import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../../v2-group/application';
import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
} from '../../../../domain/domain-service/interface';

import { AutoSaveArticleCommand } from './auto-save-article.command';

@CommandHandler(AutoSaveArticleCommand)
export class AutoSaveArticleHandler implements ICommandHandler<AutoSaveArticleCommand, void> {
  public constructor(
    @Inject(ARTICLE_DOMAIN_SERVICE_TOKEN)
    private readonly _articleDomainService: IArticleDomainService,
    @Inject(GROUP_APPLICATION_TOKEN)
    protected _groupAppService: IGroupApplicationService
  ) {}

  public async execute(command: AutoSaveArticleCommand): Promise<void> {
    await this._articleDomainService.autoSave(command.payload);
  }
}
