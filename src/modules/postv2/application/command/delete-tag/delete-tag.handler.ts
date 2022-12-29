import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TagFactory } from '../../../domain/model/tag/tag.factory';
import {
  ITagRepository,
  TAG_REPOSITORY,
} from '../../../domain/repositoty-interface/tag.repository.interface';
import { DeleteTagCommand } from './delete-tag.command';

@CommandHandler(DeleteTagCommand)
export class DeleteTagHandler implements ICommandHandler<DeleteTagCommand, void> {
  @Inject(TAG_REPOSITORY)
  private readonly _tagRepository: ITagRepository;
  @Inject() private readonly _tagFactory: TagFactory;

  public async execute(command: DeleteTagCommand): Promise<void> {
    const { id } = command.payload;
    const tag = await this._tagRepository.findOne({ id });
    if (!tag) {
      throw new NotFoundException('The tag found');
    }

    tag.delete();
    await this._tagRepository.delete(id);

    tag.commit();
  }
}
