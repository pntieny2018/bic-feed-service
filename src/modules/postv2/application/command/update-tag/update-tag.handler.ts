import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Tag } from '../../../domain/model/tag/tag';
import {
  ITagRepository,
  TAG_REPOSITORY,
} from '../../../domain/repositoty-interface/tag.repository.interface';
import { UpdatetagCommand } from './update-tag.command';

@CommandHandler(UpdatetagCommand)
export class UpdateTagHandler implements ICommandHandler<UpdatetagCommand, void> {
  @Inject(TAG_REPOSITORY)
  private readonly _tagRepository: ITagRepository;

  public async execute(command: UpdatetagCommand): Promise<void> {
    const { name, id, userId } = command.payload;
    const tag = await this._tagRepository.findOne({ id });
    if (!tag) {
      throw new NotFoundException('Not found');
    }

    const findTagNameInGroup = await this._tagRepository.findOne({ groupId: tag.groupId, name });
    if (findTagNameInGroup && findTagNameInGroup.id !== id) {
      throw new BadRequestException('Tag name already existed');
    }

    if (tag.totalUsed > 0) {
      throw new NotFoundException('This tag is used, can not update');
    }

    tag.update({
      name: name,
      updatedBy: userId,
    });
    if (tag.isChanged) {
      await this._tagRepository.update(tag);
      tag.commit();
    }
  }
}
