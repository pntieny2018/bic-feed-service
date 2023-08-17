import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ITagDomainService,
  TAG_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import {
  TagDuplicateNameException,
  TagNotFoundException,
  TagUsedException,
  TagNoUpdatePermissionException,
} from '../../../domain/exception';
import { UpdateTagCommand } from './update-tag.command';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../../v2-user/application';
import { TagDto } from '../../dto';

@CommandHandler(UpdateTagCommand)
export class UpdateTagHandler implements ICommandHandler<UpdateTagCommand, TagDto> {
  @Inject(TAG_REPOSITORY_TOKEN)
  private readonly _tagRepository: ITagRepository;
  @Inject(TAG_DOMAIN_SERVICE_TOKEN)
  private readonly _tagDomainService: ITagDomainService;
  @Inject(USER_APPLICATION_TOKEN)
  private readonly _userAppService: IUserApplicationService;

  public async execute(command: UpdateTagCommand): Promise<TagDto> {
    const { name, id, userId } = command.payload;

    const tag = await this._tagRepository.findOne({ id });
    if (!tag) {
      throw new TagNotFoundException();
    }

    const canUpdateTag = await this._userAppService.canCudTagInCommunityByUserId(
      userId,
      tag.get('groupId')
    );
    if (!canUpdateTag) {
      throw new TagNoUpdatePermissionException();
    }

    const tagEntityUpdated = await this._tagDomainService.updateTag(tag, {
      name,
      userId,
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
