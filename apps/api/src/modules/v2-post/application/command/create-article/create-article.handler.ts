import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { CreateArticleCommand } from './create-article.command';
import { CreateArticleDto } from './create-article.dto';
import { IContentRepository, CONTENT_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { CONTENT_VALIDATOR_TOKEN, IContentValidator } from '../../../domain/validator/interface';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';

@CommandHandler(CreateArticleCommand)
export class CreateArticleHandler
  implements ICommandHandler<CreateArticleCommand, CreateArticleDto>
{
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(POST_DOMAIN_SERVICE_TOKEN)
    private readonly _postDomainService: IPostDomainService,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupApplicationService: IGroupApplicationService,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator
  ) {}

  public async execute(command: CreateArticleCommand): Promise<CreateArticleDto> {
    const { groupIds, authUser } = command.payload;
    await this._contentValidator.checkCanCRUDContent(authUser, groupIds);
    const groups = await this._groupApplicationService.findAllByIds(groupIds);
    const tagEntity = await this._postDomainService.createDraftPost({
      userId: authUser.id,
      groups,
    });
    const data = new CreateArticleDto({
      id: tagEntity.get('id'),
      audience: {
        groups,
      },
      setting: tagEntity.get('setting'),
    });
    return data;
  }
}
