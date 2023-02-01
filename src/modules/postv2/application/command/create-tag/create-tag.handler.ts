import { DomainEvents } from '@beincom/domain';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { v4 } from 'uuid';
import { TagCreatedEvent } from '../../../domain/event';
import { TagFactory } from '../../../domain/factory/tag.factory';
import { GroupId } from '../../../domain/model/group';
import { TagEntity, TagId } from '../../../domain/model/tag';
import { CreateTagCommand } from './create-tag.command';

@CommandHandler(CreateTagCommand)
export class CreateTagHandler implements ICommandHandler<CreateTagCommand, TagEntity> {
  @Inject() private readonly _tagFactory: TagFactory;

  public async execute(command: CreateTagCommand): Promise<TagEntity> {
    const { name, groupId, userId } = command.payload;
    const tagEntity = this._tagFactory.create({
      name,
      groupId,
      createdBy: userId,
    });

    tagEntity.raiseEvent(new TagCreatedEvent(tagEntity));

    DomainEvents.publishEvents(tagEntity.id, null);

    // await this._tagRepository.create(tag);

    return tagEntity.toObject();
  }
}
