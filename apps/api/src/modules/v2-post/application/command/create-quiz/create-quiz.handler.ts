import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ITagDomainService,
  TAG_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { TagDuplicateNameException } from '../../../domain/exception';
import { CreateQuizCommand } from './create-quiz.command';
import { TagNoCreatePermissionException } from '../../../domain/exception';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../../v2-user/application';
import { TagDto } from '../../dto';

@CommandHandler(CreateQuizCommand)
export class CreateQuizHandler implements ICommandHandler<CreateQuizCommand, TagDto> {
  @Inject(TAG_REPOSITORY_TOKEN)
  private readonly _tagRepository: ITagRepository;
  @Inject(TAG_DOMAIN_SERVICE_TOKEN)
  private readonly _tagDomainService: ITagDomainService;
  @Inject(USER_APPLICATION_TOKEN)
  private readonly _userAppService: IUserApplicationService;

  public async execute(command: CreateQuizCommand): Promise<TagDto> {
    const { name, groupId, userId } = command.payload;

    const canCreateTag = await this._userAppService.canCudTagInCommunityByUserId(userId, groupId);
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

    return new TagDto({
      id: tagEntity.get('id'),
      name: tagEntity.get('name'),
      groupId: tagEntity.get('groupId'),
      slug: tagEntity.get('slug'),
      totalUsed: tagEntity.get('totalUsed'),
    });
  }
}
