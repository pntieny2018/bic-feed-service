import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ITagDomainService,
  TAG_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interfaces/tag.domain-service.interface';
import {
  ITagRepository,
  TAG_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface/tag.repository.interface';
import { TagNotFoundException } from '../../../exception';
import { TagUsedException } from '../../../exception/tag-used.exception';
import { DeleteTagCommand } from './delete-tag.command';

@CommandHandler(DeleteTagCommand)
export class DeleteTagHandler implements ICommandHandler<DeleteTagCommand, void> {
  @Inject(TAG_DOMAIN_SERVICE_TOKEN)
  private readonly _tagDomainService: ITagDomainService;
  @Inject(TAG_REPOSITORY_TOKEN)
  private readonly _tagRepository: ITagRepository;

  public async execute(command: DeleteTagCommand): Promise<void> {
    const { id } = command.payload;
    const tag = await this._tagRepository.findOne({ id });
    if (!tag) {
      throw new TagNotFoundException();
    }

    if (tag.get('totalUsed').value > 0) {
      throw new TagUsedException();
    }

    return this._tagDomainService.deleteTag(id);
  }
}
