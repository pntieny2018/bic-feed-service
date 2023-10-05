import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
} from '../../../../domain/domain-service/interface';
import {
  CONTENT_BINDING_TOKEN,
  IContentBinding,
} from '../../../binding/binding-post/content.interface';
import { ArticleDto } from '../../../dto';

import { PublishArticleCommand } from './publish-article.command';

@CommandHandler(PublishArticleCommand)
export class PublishArticleHandler implements ICommandHandler<PublishArticleCommand, ArticleDto> {
  public constructor(
    @Inject(ARTICLE_DOMAIN_SERVICE_TOKEN)
    private readonly _articleDomainService: IArticleDomainService,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding
  ) {}

  public async execute(command: PublishArticleCommand): Promise<ArticleDto> {
    const { actor, ...payload } = command.payload;
    const articleEntity = await this._articleDomainService.publish({ payload, actor });

    return this._contentBinding.articleBinding(articleEntity, { actor, authUser: actor });
  }
}
