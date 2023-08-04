import { v4 } from 'uuid';
import { StringHelper } from '../../../../common/helpers';
import { TagEntity, TagAttributes } from '../model/tag';
import { Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { CreateTagProps, ITagFactory } from './interface';

export class TagFactory implements ITagFactory {
  @Inject(EventPublisher) private readonly _eventPublisher: EventPublisher;

  public create(options: CreateTagProps): TagEntity {
    const { name, groupId, userId } = options;
    const now = new Date();
    const tagEntity = new TagEntity({
      id: v4(),
      groupId: groupId,
      name: name,
      slug: StringHelper.convertToSlug(name),
      totalUsed: 0,
      createdBy: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    return this._eventPublisher.mergeObjectContext(tagEntity);
  }

  public reconstitute(properties: TagAttributes): TagEntity {
    return new TagEntity(properties);
  }
}
