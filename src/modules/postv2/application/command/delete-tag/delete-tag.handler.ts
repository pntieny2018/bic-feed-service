import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ITag } from '../../../domain/model/tag/tag';
import { TagFactory } from '../../../domain/model/tag/tag.factory';
import {
  ITagRepository,
  TAG_REPOSITORY,
} from '../../../domain/repositoty-interface/tag.repository.interface';
import { DeleteTagCommand } from './delete-tag.command';

@CommandHandler(DeleteTagCommand)
export class CreateTagHandler implements ICommandHandler<DeleteTagCommand, ITag> {
  @Inject(TAG_REPOSITORY)
  private readonly _tagRepository: ITagRepository;
  @Inject() private readonly _tagFactory: TagFactory;

  public async execute(command: DeleteTagCommand): Promise<ITag> {
    const { id, userId } = command.payload;
    const tag = await this._tagRepository.findOne(id);
    if (!tag) {
      throw new NotFoundException('Not fond');
    }

    tag.delete({
      name,
      updatedBy: userId,
    });
    await this._tagRepository.save(tag);

    tag.commit();
    return tag;
  }
}
