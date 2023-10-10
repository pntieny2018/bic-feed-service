import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AUTHORITY_APP_SERVICE_TOKEN, IAuthorityAppService } from '../../../../../authority';
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
  @Inject(AUTHORITY_APP_SERVICE_TOKEN)
  private readonly _authorityAppService: IAuthorityAppService;

  public async execute(command: CreateTagCommand): Promise<TagDto> {
    const { name, groupId, user } = command.payload;

    await this._authorityAppService.buildAbility(user);
    const canCreateTag = this._authorityAppService.canCudTags(groupId);
    if (!canCreateTag) {
      throw new TagNoCreatePermissionException();
    }

    const tagEntity = await this._tagDomainService.createTag({
      name,
      groupId,
      userId: user.id,
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
