import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GroupId } from '../../../../v2-group/domain/model/group';
import { UserId } from '../../../../v2-user/domain/model/user';
import {
  ITagDomainService,
  TAG_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { TagName } from '../../../domain/model/tag';
import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { TagDuplicateNameException } from '../../../exception';
import { CreateTagCommand } from './create-tag.command';
import { CreateTagResult } from './create-tag.result';

@CommandHandler(CreateTagCommand)
export class CreateTagHandler implements ICommandHandler<CreateTagCommand, CreateTagResult> {
  @Inject(TAG_REPOSITORY_TOKEN)
  private readonly _tagRepository: ITagRepository;
  @Inject(TAG_DOMAIN_SERVICE_TOKEN)
  private readonly _tagDomainService: ITagDomainService;

  public async execute(command: CreateTagCommand): Promise<CreateTagResult> {
    const { name, groupId, userId } = command.payload;
    const findTagNameInGroup = await this._tagRepository.findOne({
      groupId: GroupId.fromString(groupId),
      name: TagName.fromString(name),
    });
    if (findTagNameInGroup) {
      throw new TagDuplicateNameException();
    }

    const tagEntity = await this._tagDomainService.createTag({
      name: TagName.fromString(name),
      groupId: GroupId.fromString(groupId),
      userId: UserId.fromString(userId),
    });

    return {
      id: tagEntity.get('id').value,
      name: tagEntity.get('name').value,
      groupId: tagEntity.get('groupId').value,
      slug: tagEntity.get('slug').value,
      totalUsed: tagEntity.get('totalUsed').value,
    };
  }
}
