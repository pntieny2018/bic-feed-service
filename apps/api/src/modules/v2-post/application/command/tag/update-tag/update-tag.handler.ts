import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  ITagDomainService,
  TAG_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { TagNotFoundException, TagNoUpdatePermissionException } from '../../../../domain/exception';
import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../../../../domain/repositoty-interface';
import { IUserAdapter, USER_ADAPTER } from '../../../../domain/service-adapter-interface';
import { TagDto } from '../../../dto';

import { UpdateTagCommand } from './update-tag.command';

@CommandHandler(UpdateTagCommand)
export class UpdateTagHandler implements ICommandHandler<UpdateTagCommand, TagDto> {
  @Inject(TAG_REPOSITORY_TOKEN)
  private readonly _tagRepository: ITagRepository;
  @Inject(TAG_DOMAIN_SERVICE_TOKEN)
  private readonly _tagDomainService: ITagDomainService;
  @Inject(USER_ADAPTER)
  private readonly _userAdapter: IUserAdapter;

  public async execute(command: UpdateTagCommand): Promise<TagDto> {
    const { id, name, actor } = command.payload;

    const tag = await this._tagRepository.findOne({ id });
    if (!tag) {
      throw new TagNotFoundException();
    }

    const canUpdateTag = await this._userAdapter.canCudTags(actor.id, tag.get('groupId'));
    if (!canUpdateTag) {
      throw new TagNoUpdatePermissionException();
    }

    const tagEntityUpdated = await this._tagDomainService.updateTag(tag, {
      name,
      userId: actor.id,
    });

    return new TagDto({
      id: tagEntityUpdated.get('id'),
      name: tagEntityUpdated.get('name'),
      groupId: tagEntityUpdated.get('groupId'),
      slug: tagEntityUpdated.get('slug'),
      totalUsed: tagEntityUpdated.get('totalUsed'),
    });
  }
}
