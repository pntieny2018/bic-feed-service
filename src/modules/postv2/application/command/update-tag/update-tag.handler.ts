import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ITagDomainService,
  TAG_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interfaces/tag.domain-service.interface';
import { TagId, TagName } from '../../../domain/model/tag';
import { UserId } from '../../../domain/model/user';
import {
  ITagRepository,
  TAG_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface/tag.repository.interface';
import { TagDuplicateNameException, TagNotFoundException } from '../../../exception';
import { TagUsedException } from '../../../exception/tag-used.exception';
import { UpdatetagCommand } from './update-tag.command';

@CommandHandler(UpdatetagCommand)
export class UpdateTagHandler implements ICommandHandler<UpdatetagCommand, void> {
  @Inject(TAG_REPOSITORY_TOKEN)
  private readonly _tagRepository: ITagRepository;
  @Inject(TAG_DOMAIN_SERVICE_TOKEN)
  private readonly _tagDomainService: ITagDomainService;

  public async execute(command: UpdatetagCommand): Promise<void> {
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

    if (tag.get('totalUsed').value > 0) {
      throw new TagUsedException();
    }

    await this._tagDomainService.updateTag(tag, {
      id: tag.get('id'),
      name: TagName.fromString(name),
      userId: UserId.fromString(userId),
    });
  }
}
