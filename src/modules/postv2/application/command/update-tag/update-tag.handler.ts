import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ITagDomainService,
  TAG_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interfaces/tag.domain-service.interface';
import {
  ITagRepository,
  TAG_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface/tag.repository.interface';
import { TagDuplicateNameException } from '../../../exception';
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
    const tag = await this._tagRepository.findOne({ id });
    if (!tag) {
      throw new NotFoundException('Not found');
    }

    const findTagNameInGroup = await this._tagRepository.findOne({
      groupId: tag.get('groupId').value,
      name,
    });
    if (findTagNameInGroup && findTagNameInGroup.id.value !== id) {
      throw new TagDuplicateNameException();
    }

    if (tag.get('totalUsed').value > 0) {
      throw new TagUsedException();
    }

    return this._tagDomainService.updateTag(tag, {
      id,
      name,
      userId,
    });
  }
}
