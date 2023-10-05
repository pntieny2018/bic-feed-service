import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
} from '../../../../domain/domain-service/interface';
import { ContentBinding } from '../../../binding/binding-post/content.binding';
import { CONTENT_BINDING_TOKEN } from '../../../binding/binding-post/content.interface';
import { ArticleDto } from '../../../dto';

import { UpdateArticleCommand } from './update-article.command';

@CommandHandler(UpdateArticleCommand)
export class UpdateArticleHandler implements ICommandHandler<UpdateArticleCommand, ArticleDto> {
  public constructor(
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: ContentBinding,
    @Inject(ARTICLE_DOMAIN_SERVICE_TOKEN)
    private readonly _articleDomainService: IArticleDomainService
  ) {}

  public async execute(command: UpdateArticleCommand): Promise<ArticleDto> {
    const { actor, ...payload } = command.payload;
    const articleEntity = await this._articleDomainService.update({ payload, actor });
    return this._contentBinding.articleBinding(articleEntity, { actor, authUser: actor });
  }
}
