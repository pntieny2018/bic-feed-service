import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ITag } from '../../../domain/model/tag/tag';
import { TagFactory } from '../../../domain/model/tag/tag.factory';
import {
  ITagRepository,
  TAG_REPOSITORY,
} from '../../../domain/repositoty-interface/tag.repository.interface';
import { CreatetagCommand } from './create-tag.command';

@CommandHandler(CreatetagCommand)
export class CreateTagHandler implements ICommandHandler<CreatetagCommand, ITag> {
  @Inject(TAG_REPOSITORY)
  private readonly _tagRepository: ITagRepository;
  @Inject() private readonly _tagFactory: TagFactory;

  public async execute(command: CreatetagCommand): Promise<ITag> {
    const { name, groupId, userId } = command.payload;
    const tag = this._tagFactory.create({
      name,
      groupId,
      createdBy: userId,
    });

    await this._tagRepository.save(tag);

    tag.commit();
    return tag;
  }
}
