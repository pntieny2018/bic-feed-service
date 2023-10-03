import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
} from '../../../../domain/domain-service/interface';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../../binding';
import { ArticleDto } from '../../../dto';

import { CreateDraftArticleCommand } from './create-draft-article.command';

@CommandHandler(CreateDraftArticleCommand)
export class CreateDraftArticleHandler
  implements ICommandHandler<CreateDraftArticleCommand, ArticleDto>
{
  public constructor(
    @Inject(ARTICLE_DOMAIN_SERVICE_TOKEN)
    private readonly _articleDomainService: IArticleDomainService,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding
  ) {}

  public async execute(command: CreateDraftArticleCommand): Promise<ArticleDto> {
    const { authUser } = command.payload;
    const articleEntity = await this._articleDomainService.createDraft({
      userId: authUser.id,
      groups: [],
    });

    return this._contentBinding.articleBinding(articleEntity, {
      actor: authUser,
      authUser,
    });
  }
}
