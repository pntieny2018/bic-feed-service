import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
} from '../../../../../v2-user/application';
import {
  ITagDomainService,
  TAG_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { TagNoCreatePermissionException } from '../../../../domain/exception';
import { TagDto } from '../../../dto';

import { CreateTagCommand } from './create-tag.command';

@CommandHandler(CreateTagCommand)
export class CreateTagHandler implements ICommandHandler<CreateTagCommand, TagDto> {
  @Inject(TAG_DOMAIN_SERVICE_TOKEN)
  private readonly _tagDomainService: ITagDomainService;
  @Inject(USER_APPLICATION_TOKEN)
  private readonly _userAppService: IUserApplicationService;

  public async execute(command: CreateTagCommand): Promise<TagDto> {
    const { name, groupId, userId } = command.payload;

    const canCreateTag = await this._userAppService.canCudTagInCommunityByUserId(userId, groupId);
    if (!canCreateTag) {
      throw new TagNoCreatePermissionException();
    }

    const tagEntity = await this._tagDomainService.createTag({
      name,
      groupId,
      userId,
    });

    return new TagDto({
      id: tagEntity.get('id'),
      name: tagEntity.get('name'),
      groupId: tagEntity.get('groupId'),
      slug: tagEntity.get('slug'),
      totalUsed: tagEntity.get('totalUsed'),
    });
  }
}
