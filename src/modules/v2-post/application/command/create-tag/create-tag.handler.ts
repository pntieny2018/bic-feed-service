import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GroupId } from '../../../../v2-group/domain/model/group';
import { UserId } from '../../../../v2-user/domain/model/user';
import {
  ITagDomainService,
  TAG_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { TagDuplicateNameException } from '../../../exception';
import { CreateTagCommand } from './create-tag.command';
import { CreateTagDto } from './create-tag.dto';

@CommandHandler(CreateTagCommand)
export class CreateTagHandler implements ICommandHandler<CreateTagCommand, CreateTagDto> {
  @Inject(TAG_REPOSITORY_TOKEN)
  private readonly _tagRepository: ITagRepository;
  @Inject(TAG_DOMAIN_SERVICE_TOKEN)
  private readonly _tagDomainService: ITagDomainService;

  public async execute(command: CreateTagCommand): Promise<CreateTagDto> {
    const { name, groupId, userId } = command.payload;
    const findTagNameInGroup = await this._tagRepository.findOne({
      groupId,
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

    return {
      id: tagEntity.get('id'),
      name: tagEntity.get('name'),
      groupId: tagEntity.get('groupId'),
      slug: tagEntity.get('slug'),
      totalUsed: tagEntity.get('totalUsed'),
    };
  }
}
