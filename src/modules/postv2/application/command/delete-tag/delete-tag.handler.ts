import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Tag } from '../../../domain/model/tag/tag';
import { TagFactory } from '../../../domain/model/tag/tag.factory';
import {
  ITagRepository,
  TAG_REPOSITORY,
} from '../../../domain/repositoty-interface/tag.repository.interface';
import { DeleteTagCommand } from './delete-tag.command';

@CommandHandler(DeleteTagCommand)
export class CreateTagHandler implements ICommandHandler<DeleteTagCommand, void> {
  @Inject(TAG_REPOSITORY)
  private readonly _tagRepository: ITagRepository;
  @Inject() private readonly _tagFactory: TagFactory;

  public async execute(command: DeleteTagCommand): Promise<void> {
    const { id, userId } = command.payload;
    const tag = await this._tagRepository.findOne({ id });
    if (!tag) {
      throw new NotFoundException('Not fond');
    }

    tag.delete();
    await this._tagRepository.delete(id);

    tag.commit();
  }
}
