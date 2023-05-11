import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { CreateDraftPostCommand } from './create-draft-post.command';
import { CreateDraftPostDto } from './create-draft-post.dto';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../../v2-user/application';
import {
  IPostRepository,
  POST_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface/post.repository.interface';
import {
  IContentValidator,
  CONTENT_VALIDATOR_TOKEN,
} from '../../../domain/validator/interface/content.validator.interface';

@CommandHandler(CreateDraftPostCommand)
export class CreateDraftPostHandler
  implements ICommandHandler<CreateDraftPostCommand, CreateDraftPostDto>
{
  @Inject(POST_REPOSITORY_TOKEN)
  private readonly _postRepository: IPostRepository;
  @Inject(POST_DOMAIN_SERVICE_TOKEN)
  private readonly _postDomainService: IPostDomainService;
  @Inject(USER_APPLICATION_TOKEN)
  private readonly _userAppService: IUserApplicationService;
  @Inject(CONTENT_VALIDATOR_TOKEN)
  private readonly _contentValidator: IContentValidator;

  public async execute(command: CreateDraftPostCommand): Promise<CreateDraftPostDto> {
    const { groupIds, authUser } = command.payload;
    await this._contentValidator.checkCanCRUDContent(authUser, groupIds);

    const tagEntity = await this._postDomainService.createDraftPost({
      groupIds,
      userId: authUser.id,
    });

    return new CreateDraftPostDto({
      id: tagEntity.get('id'),
    });
  }
}
