import { Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { v4 } from 'uuid';
import { StringHelper } from '../../../../../common/helpers';
import { ITag, Tag, TagProperties } from './tag';

type CreateTagOptions = Readonly<{
  name: string;
  groupId: string;
  createdBy: string;
}>;

export class TagFactory {
  @Inject(EventPublisher) private readonly _eventPublisher: EventPublisher;

  public create(options: CreateTagOptions): ITag {
    const { name, groupId, createdBy } = options;
    return this._eventPublisher.mergeObjectContext(
      new Tag({
        id: v4(),
        name,
        groupId,
        slug: StringHelper.convertToSlug(name),
        createdBy,
        updatedBy: createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
        totalUsed: 0,
      })
    );
  }

  public reconstitute(properties: TagProperties): Tag {
    return this._eventPublisher.mergeObjectContext(new Tag(properties));
  }
}
