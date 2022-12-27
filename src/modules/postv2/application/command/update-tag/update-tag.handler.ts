import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ITag } from '../../../domain/model/tag/tag';
import {
  ITagRepository,
  TAG_REPOSITORY,
} from '../../../domain/repositoty-interface/tag.repository.interface';
import { UpdatetagCommand } from './update-tag.command';

@CommandHandler(UpdatetagCommand)
export class UpdateTagHandler implements ICommandHandler<UpdatetagCommand, ITag> {
  @Inject(TAG_REPOSITORY)
  private readonly _tagRepository: ITagRepository;

  public async execute(command: UpdatetagCommand): Promise<ITag> {
    const { name, id, userId } = command.payload;
    const tag = await this._tagRepository.findOne(id);
    if (!tag) {
      throw new NotFoundException('Not fond');
    }

    tag.update({
      name,
      updatedBy: userId,
    });
    await this._tagRepository.save(tag);

    tag.commit();
    return tag;
  }
}
