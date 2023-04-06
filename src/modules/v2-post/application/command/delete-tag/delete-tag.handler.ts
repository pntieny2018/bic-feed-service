import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ITagDomainService,
  TAG_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { TagNotFoundException, TagUsedException } from '../../../exception';
import { DeleteTagCommand } from './delete-tag.command';
import { TagNoDeletePermissionException } from '../../../exception/tag-no-delete-permission.exception';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../../v2-user/application';

@CommandHandler(DeleteTagCommand)
export class DeleteTagHandler implements ICommandHandler<DeleteTagCommand, void> {
  @Inject(TAG_DOMAIN_SERVICE_TOKEN)
  private readonly _tagDomainService: ITagDomainService;
  @Inject(TAG_REPOSITORY_TOKEN)
  private readonly _tagRepository: ITagRepository;
  @Inject(USER_APPLICATION_TOKEN)
  private readonly _userAppService: IUserApplicationService;

  public async execute(command: DeleteTagCommand): Promise<void> {
    const { id, userId } = command.payload;
    const tag = await this._tagRepository.findOne({ id });
    if (!tag) {
      throw new TagNotFoundException();
    }

    if (tag.get('totalUsed') > 0) {
      throw new TagUsedException();
    }

    const canDeleteTag = await this._userAppService.canCudTagInCommunityByUserId(
      userId,
      tag.get('groupId'),
    );
    if (!canDeleteTag) {
      throw new TagNoDeletePermissionException();
    }

    await this._tagDomainService.deleteTag(id);
  }
}
