import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { GROUP_ADAPTER, IGroupAdapter } from '../../../../domain/service-adapter-interface';
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
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator
  ) {}

  public async execute(command: CreateDraftPostCommand): Promise<CreateDraftPostDto> {
    const { groupIds, authUser } = command.payload;
    const groups = await this._groupAdapter.getGroupsByIds(groupIds);
    await this._contentValidator.checkCanCRUDContent({ user: authUser, groupIds, groups });
    const postEntity = await this._postDomainService.createDraftPost({
      userId: authUser.id,
      groups,
    });

    return new CreateDraftPostDto({
      id: postEntity.get('id'),
      audience: {
        groups,
      },
      setting: postEntity.get('setting'),
    });
  }
}
