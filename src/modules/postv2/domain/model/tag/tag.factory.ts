import { Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { v4 } from 'uuid';
import { StringHelper } from '../../../../../common/helpers';
import { ITag, TagEntity } from './tag.entity';

type CreateTagOptions = Readonly<{
  id: string;
  name: string;
  groupId: string;
  createdBy: string;
}>;

export class TagFactory {
  @Inject(EventPublisher) private readonly _eventPublisher: EventPublisher;

  public create(options: CreateTagOptions): ITag {
    const { name, groupId, createdBy } = options;
    return this._eventPublisher.mergeObjectContext(
      new TagEntity({
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
}
