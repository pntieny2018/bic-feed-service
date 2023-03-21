import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ITagDomainService,
  TAG_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { TagDuplicateNameException, TagNotFoundException } from '../../../exception';
import { UpdateTagCommand } from './update-tag.command';
import { UpdateTagDto } from './update-tag.dto';
import { TagNoUpdatePermissionException } from '../../../exception/tag-no-update-permission.exception';

@CommandHandler(UpdateTagCommand)
export class UpdateTagHandler implements ICommandHandler<UpdateTagCommand, UpdateTagDto> {
  @Inject(TAG_REPOSITORY_TOKEN)
  private readonly _tagRepository: ITagRepository;
  @Inject(TAG_DOMAIN_SERVICE_TOKEN)
  private readonly _tagDomainService: ITagDomainService;

  public async execute(command: UpdateTagCommand): Promise<UpdateTagDto> {
    const { name, id, userId } = command.payload;

    const tag = await this._tagRepository.findOne({ id });
    if (!tag) {
      throw new TagNotFoundException();
    }

    const canUpdateTag = await this._tagRepository.canCUDTag(userId, tag.get('groupId'));
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

    return {
      id: tag.get('id'),
      name: tag.get('name'),
      groupId: tag.get('groupId'),
      slug: tag.get('slug'),
      totalUsed: tag.get('totalUsed'),
    };
  }
}
