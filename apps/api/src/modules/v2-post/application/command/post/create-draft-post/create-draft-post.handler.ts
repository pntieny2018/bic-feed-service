import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../../v2-group/application';
import {
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { CONTENT_VALIDATOR_TOKEN, IContentValidator } from '../../../../domain/validator/interface';
import { CreateDraftPostDto } from '../../../dto';

import { CreateDraftPostCommand } from './create-draft-post.command';

@CommandHandler(CreateDraftPostCommand)
export class CreateDraftPostHandler
  implements ICommandHandler<CreateDraftPostCommand, CreateDraftPostDto>
{
  public constructor(
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
    const postEntity = await this._postDomainService.createDraftPost({
      userId: authUser.id,
      groups,
    });
    const data = new CreateDraftPostDto({
      id: postEntity.get('id'),
      audience: {
        groups,
      },
      setting: postEntity.get('setting'),
    });
    return data;
  }
}
