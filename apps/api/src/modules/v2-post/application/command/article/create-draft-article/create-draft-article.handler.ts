import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
} from '../../../../domain/domain-service/interface';
import { GROUP_ADAPTER, IGroupAdapter } from '../../../../domain/service-adapter-interface';
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
    private readonly _contentBinding: IContentBinding,
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter
  ) {}

  public async execute(command: CreateDraftArticleCommand): Promise<ArticleDto> {
    const { authUser, groupIds } = command.payload;
    const groups = await this._groupAdapter.getGroupsByIds(groupIds);
    const articleEntity = await this._articleDomainService.createDraft({
      userId: authUser.id,
      groups,
    });

    return this._contentBinding.articleBinding(articleEntity, {
      actor: authUser,
      authUser,
    });
  }
}
