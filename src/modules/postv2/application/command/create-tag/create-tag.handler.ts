import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ITagDomainService,
  TAG_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interfaces/tag.domain-service.interface';
import { TagEntity } from '../../../domain/model/tag';
import {
  ITagRepository,
  TAG_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface/tag.repository.interface';
import { TagDuplicateNameException } from '../../../exception';
import { CreateTagCommand } from './create-tag.command';

@CommandHandler(CreateTagCommand)
export class CreateTagHandler implements ICommandHandler<CreateTagCommand, TagEntity> {
  @Inject(TAG_REPOSITORY_TOKEN)
  private readonly _tagRepository: ITagRepository;
  @Inject(TAG_DOMAIN_SERVICE_TOKEN)
  private readonly _tagDomainService: ITagDomainService;

  public async execute(command: CreateTagCommand): Promise<TagEntity> {
    const { name, groupId, userId } = command.payload;

    const findTagNameInGroup = await this._tagRepository.findOne({
      groupId: groupId,
      name,
    });
    if (findTagNameInGroup) {
      throw new TagDuplicateNameException();
    }

    const tagEntity = await this._tagDomainService.createTag({
      name,
      groupId,
      userId,
    });

    return tagEntity.toObject();
  }
}
