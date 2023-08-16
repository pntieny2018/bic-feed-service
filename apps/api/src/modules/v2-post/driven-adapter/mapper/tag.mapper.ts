import { TagAttributes, TagModel } from '@libs/database/postgres/model/tag.model';
import { Inject, Injectable } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';

import { TagEntity } from '../../domain/model/tag';

@Injectable()
export class TagMapper {
  public constructor(@Inject(EventPublisher) private readonly _eventPublisher: EventPublisher) {}

  public toDomain(model: TagModel): TagEntity {
    if (model === null) {
      return null;
    }
    return this._eventPublisher.mergeObjectContext(new TagEntity(model.toJSON()));
  }

  public toPersistence(entity: TagEntity): TagAttributes {
    return {
      id: entity.get('id'),
      groupId: entity.get('groupId'),
      name: entity.get('name'),
      slug: entity.get('slug'),
      totalUsed: entity.get('totalUsed'),
      updatedBy: entity.get('updatedBy'),
      createdBy: entity.get('createdBy'),
      createdAt: entity.get('createdAt'),
      updatedAt: entity.get('updatedAt'),
    };
  }
}
