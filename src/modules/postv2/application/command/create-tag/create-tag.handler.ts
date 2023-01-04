import { BadRequestException, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Tag } from '../../../domain/model/tag/tag';
import { TagFactory } from '../../../domain/factory/tag.factory';
import {
  ITagRepository,
  TAG_REPOSITORY,
} from '../../../domain/repositoty-interface/tag.repository.interface';
import { TagDuplicateNameException } from '../../../exception/tag-duplicate-name.exception';
import { CreatetagCommand } from './create-tag.command';

@CommandHandler(CreatetagCommand)
export class CreateTagHandler implements ICommandHandler<CreatetagCommand, Tag> {
  @Inject(TAG_REPOSITORY)
  private readonly _tagRepository: ITagRepository;
  @Inject() private readonly _tagFactory: TagFactory;

  public async execute(command: CreatetagCommand): Promise<Tag> {
    const { name, groupId, userId } = command.payload;

    const findTagByName = await this._tagRepository.findOne({
      name,
      groupId,
    });
    if (findTagByName) {
      throw new TagDuplicateNameException();
    }

    const tag = this._tagFactory.create({
      name,
      groupId,
      createdBy: userId,
    });

    await this._tagRepository.create(tag);

    tag.commit();
    return tag;
  }
}
