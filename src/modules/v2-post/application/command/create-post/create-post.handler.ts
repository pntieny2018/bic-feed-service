import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ITagDomainService,
  TAG_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { TagDuplicateNameException } from '../../../exception';
import { CreatePostCommand } from './create-post.command';
import { CreatePostDto } from './create-post.dto';
import { TagNoCreatePermissionException } from '../../../exception/tag/tag-no-create-permission.exception';

@CommandHandler(CreatePostCommand)
export class CreatePostHandler implements ICommandHandler<CreatePostCommand, CreatePostDto> {
  @Inject(TAG_REPOSITORY_TOKEN)
  private readonly _tagRepository: ITagRepository;
  @Inject(TAG_DOMAIN_SERVICE_TOKEN)
  private readonly _tagDomainService: ITagDomainService;

  public async execute(command: CreatePostCommand): Promise<CreatePostDto> {
    const { groupIds, userId } = command.payload;

    const canCreateTag = await this._tagRepository.canCUDTag(userId, groupId);
    if (!canCreateTag) {
      throw new TagNoCreatePermissionException();
    }

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
