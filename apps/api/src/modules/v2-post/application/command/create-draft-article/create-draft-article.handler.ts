import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { CreateDraftArticleCommand } from './create-draft-article.command';
import { IContentRepository, CONTENT_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { CONTENT_VALIDATOR_TOKEN, IContentValidator } from '../../../domain/validator/interface';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import { ArticleDto } from '../../dto';
import { CONTENT_BINDING_TOKEN } from '../../binding/binding-post/content.interface';
import { ContentBinding } from '../../binding/binding-post/content.binding';

@CommandHandler(CreateDraftArticleCommand)
export class CreateDraftArticleHandler
  implements ICommandHandler<CreateDraftArticleCommand, ArticleDto>
{
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(POST_DOMAIN_SERVICE_TOKEN)
    private readonly _postDomainService: IPostDomainService,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupApplicationService: IGroupApplicationService,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    @Inject(CONTENT_BINDING_TOKEN) private readonly _contentBinding: ContentBinding
  ) {}

  public async execute(command: CreateDraftArticleCommand): Promise<ArticleDto> {
    const { authUser } = command.payload;
    const articleEntity = await this._postDomainService.createDraftArticle({
      userId: authUser.id,
      groups: [],
    });
    const data = this._contentBinding.articleBinding(articleEntity, {
      actor: authUser,
      authUser,
    });
    return data;
  }
}
