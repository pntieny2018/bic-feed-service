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

    if (tag.get('totalUsed') > 0) {
      throw new TagUsedException();
    }

    const canUpdateTag = await this._userAppService.canCudTagInCommunityByUserId(
      userId,
      tag.get('groupId')
    );
    if (!canUpdateTag) {
      throw new TagNoUpdatePermissionException();
    }

    const findTagNameInGroup = await this._tagRepository.findOne({
      groupId: tag.get('groupId'),
      name,
    });
    if (findTagNameInGroup && findTagNameInGroup.get('id') !== id) {
      throw new TagDuplicateNameException();
    }

    await this._tagDomainService.updateTag(tag, {
      id: tag.get('id'),
      name,
      userId,
    });

    return new TagDto({
      id: tag.get('id'),
      name: tag.get('name'),
      groupId: tag.get('groupId'),
      slug: tag.get('slug'),
      totalUsed: tag.get('totalUsed'),
    });
  }
}
