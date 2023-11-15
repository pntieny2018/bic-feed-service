import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  ITagDomainService,
  TAG_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { TagNotFoundException, TagNoDeletePermissionException } from '../../../../domain/exception';
import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../../../../domain/repositoty-interface';
import { IUserAdapter, USER_ADAPTER } from '../../../../domain/service-adapter-interface';

import { DeleteTagCommand } from './delete-tag.command';

@CommandHandler(DeleteTagCommand)
export class DeleteTagHandler implements ICommandHandler<DeleteTagCommand, void> {
  @Inject(TAG_DOMAIN_SERVICE_TOKEN)
  private readonly _tagDomainService: ITagDomainService;
  @Inject(TAG_REPOSITORY_TOKEN)
  private readonly _tagRepository: ITagRepository;
  @Inject(USER_ADAPTER)
  private readonly _userAdapter: IUserAdapter;

  public async execute(command: DeleteTagCommand): Promise<void> {
    const { id, actor } = command.payload;
    const tag = await this._tagRepository.findOne({ id });
    if (!tag) {
      throw new TagNotFoundException();
    }

    const canDeleteTag = await this._userAdapter.canCudTags(actor.id, tag.get('groupId'));
    if (!canDeleteTag) {
      throw new TagNoDeletePermissionException();
    }

    await this._tagDomainService.deleteTag(tag);
  }
}
