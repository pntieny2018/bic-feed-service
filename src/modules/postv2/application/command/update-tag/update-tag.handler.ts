import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Tag } from '../../../domain/model/tag/tag';
import {
  ITagRepository,
  TAG_REPOSITORY,
} from '../../../domain/repositoty-interface/tag.repository.interface';
import { UpdatetagCommand } from './update-tag.command';

@CommandHandler(UpdatetagCommand)
export class UpdateTagHandler implements ICommandHandler<UpdatetagCommand, Tag> {
  @Inject(TAG_REPOSITORY)
  private readonly _tagRepository: ITagRepository;

  public async execute(command: UpdatetagCommand): Promise<Tag> {
    const { name, id, userId } = command.payload;
    const tag = await this._tagRepository.findOne({ id });
    if (!tag) {
      throw new NotFoundException('Not found');
    }

    const tags = await this._tagRepository.findAll({ groupIds: [tag.groupId] });

    if (tags.find((e) => e.name === name && e.groupId === tag.groupId && e.id !== tag.id)) {
      throw new BadRequestException('Tag name already existed');
    }

    if (tag.totalUsed > 0) {
      throw new NotFoundException('This tag is used, can not update');
    }

    tag.update({
      name: name,
      updatedBy: userId,
    });

    await this._tagRepository.save(tag);

    tag.commit();

    return tag;
  }
}
