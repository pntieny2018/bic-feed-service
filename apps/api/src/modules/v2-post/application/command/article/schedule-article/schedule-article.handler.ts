import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
} from '../../../../domain/domain-service/interface';
import { CONTENT_VALIDATOR_TOKEN, IContentValidator } from '../../../../domain/validator/interface';

import { ScheduleArticleCommand } from './schedule-article.command';

@CommandHandler(ScheduleArticleCommand)
export class ScheduleArticleHandler implements ICommandHandler<ScheduleArticleCommand, void> {
  public constructor(
    @Inject(ARTICLE_DOMAIN_SERVICE_TOKEN)
    private readonly _articleDomainService: IArticleDomainService,

    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator
  ) {}

  public async execute(command: ScheduleArticleCommand): Promise<void> {
    const { actor, ...payload } = command.payload;

    this._contentValidator.validateScheduleTime(payload.scheduledAt);

    await this._articleDomainService.schedule({ payload, actor });
  }
}
