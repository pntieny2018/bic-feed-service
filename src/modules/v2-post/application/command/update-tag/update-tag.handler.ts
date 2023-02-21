import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserId } from '../../../../v2-user/domain/model/user';
import {
  ITagDomainService,
  TAG_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { TagId, TagName } from '../../../domain/model/tag';
import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { TagDuplicateNameException, TagNotFoundException } from '../../../exception';
import { UpdateTagCommand } from './update-tag.command';
import { UpdateTagDto } from './update-tag.dto';

@CommandHandler(UpdateTagCommand)
export class UpdateTagHandler implements ICommandHandler<UpdateTagCommand, UpdateTagDto> {
  @Inject(TAG_REPOSITORY_TOKEN)
  private readonly _tagRepository: ITagRepository;
  @Inject(TAG_DOMAIN_SERVICE_TOKEN)
  private readonly _tagDomainService: ITagDomainService;

  public async execute(command: UpdateTagCommand): Promise<UpdateTagDto> {
    const { name, id, userId } = command.payload;
    const tag = await this._tagRepository.findOne({ id: TagId.fromString(id) });
    if (!tag) {
      throw new TagNotFoundException();
    }

    const findTagNameInGroup = await this._tagRepository.findOne({
      groupId: tag.get('groupId'),
      name: TagName.fromString(name),
    });
    if (findTagNameInGroup && findTagNameInGroup.id.value !== id) {
      throw new TagDuplicateNameException();
    }

    await this._tagDomainService.updateTag(tag, {
      id: tag.get('id'),
      name: TagName.fromString(name),
      userId: UserId.fromString(userId),
    });

    return {
      id: tag.get('id').value,
      name: tag.get('name').value,
      groupId: tag.get('groupId').value,
      slug: tag.get('slug').value,
      totalUsed: tag.get('totalUsed').value,
    };
  }
}
