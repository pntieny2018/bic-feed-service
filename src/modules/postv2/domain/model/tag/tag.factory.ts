import { BadRequestException, Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { v4 } from 'uuid';
import { Tag, TagProperties } from './tag';

type CreateTagOptions = Readonly<{
  name: string;
  groupId: string;
  createdBy: string;
}>;

export class TagFactory {
  @Inject(EventPublisher) private readonly _eventPublisher: EventPublisher;

  public create(options: CreateTagOptions): Tag {
    const { name, groupId, createdBy } = options;
    if (!name) {
      throw new BadRequestException('Tag name is required');
    }
    return this._eventPublisher.mergeObjectContext(
      new Tag({
        id: v4(),
        name,
        groupId,
        createdBy,
        updatedBy: createdBy,
      })
    );
  }

  public reconstitute(properties: TagProperties): Tag {
    return this._eventPublisher.mergeObjectContext(new Tag(properties));
  }
}
