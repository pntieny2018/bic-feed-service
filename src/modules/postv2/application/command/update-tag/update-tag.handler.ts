import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
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

    const findTagNameInGroup = await this._tagRepository.findOne({
      groupId: tag.get('groupId').value,
      name,
    });
    if (findTagNameInGroup && findTagNameInGroup.id.value !== id) {
      throw new BadRequestException('Tag name already existed');
    }

    if (tag.get('totalUsed').value > 0) {
      throw new NotFoundException('This tag is used, can not update');
    }

    // tag.update({
    //   name: name,
    //   updatedBy: userId,
    // });
    // if (tag.isChanged) {
    //   await this._tagRepository.update(tag);
    //   tag.commit();
    // }
  }
}
