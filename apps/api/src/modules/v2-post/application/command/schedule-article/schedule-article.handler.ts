import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
} from '../../../domain/domain-service/interface';
import { ArticleInvalidScheduledTimeException } from '../../../domain/exception';
import { ContentBinding } from '../../binding/binding-post/content.binding';
import { CONTENT_BINDING_TOKEN } from '../../binding/binding-post/content.interface';
import { ArticleDto } from '../../dto';

import { ScheduleArticleCommand } from './schedule-article.command';

@CommandHandler(ScheduleArticleCommand)
export class ScheduleArticleHandler implements ICommandHandler<ScheduleArticleCommand, ArticleDto> {
  public constructor(
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: ContentBinding,
    @Inject(ARTICLE_DOMAIN_SERVICE_TOKEN)
    private readonly _articleDomainService: IArticleDomainService
  ) {}

  public async execute(command: ScheduleArticleCommand): Promise<ArticleDto> {
    const payload = command.payload;
    const { actor, scheduledAt } = payload;

    const scheduledDate = new Date(scheduledAt);

    if (!scheduledDate.getTime() || scheduledDate.getTime() <= Date.now()) {
      throw new ArticleInvalidScheduledTimeException();
    }

    const articleEntity = await this._articleDomainService.schedule({
      payload,
      actor,
    });

    return this._contentBinding.articleBinding(articleEntity, { actor, authUser: actor });
  }
}
