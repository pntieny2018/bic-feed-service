import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { CreateDraftPostCommand } from './create-draft-post.command';
import { CreateDraftPostDto } from './create-draft-post.dto';
import {
  IPostRepository,
  POST_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface/post.repository.interface';
import {
  CONTENT_VALIDATOR_TOKEN,
  IContentValidator,
} from '../../../domain/validator/interface/content.validator.interface';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';

@CommandHandler(CreateDraftPostCommand)
export class CreateDraftPostHandler
  implements ICommandHandler<CreateDraftPostCommand, CreateDraftPostDto>
{
  public constructor(
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly _postRepository: IPostRepository,
    @Inject(POST_DOMAIN_SERVICE_TOKEN)
    private readonly _postDomainService: IPostDomainService,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupApplicationService: IGroupApplicationService,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator
  ) {}

  public async execute(command: CreateDraftPostCommand): Promise<CreateDraftPostDto> {
    const { groupIds, authUser } = command.payload;
    await this._contentValidator.checkCanCRUDContent(authUser, groupIds);
    const groups = await this._groupApplicationService.findAllByIds(groupIds);
    const tagEntity = await this._postDomainService.createDraftPost({
      userId: authUser.id,
      groups,
    });
    const data = new CreateDraftPostDto({
      id: tagEntity.get('id'),
      audience: {
        groups,
      },
    });
    console.log('111111111', data);
    return data;
  }
}
