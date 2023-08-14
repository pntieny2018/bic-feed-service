import { CategoryAttributes, CategoryModel } from '@libs/database/postgres/model/category.model';
import { Inject, Injectable } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';

import { CategoryEntity } from '../../domain/model/category';

@Injectable()
export class CategoryMapper {
  public constructor(@Inject(EventPublisher) private readonly _eventPublisher: EventPublisher) {}

  public toDomain(model: CategoryModel): CategoryEntity {
    if (model === null) {
      return null;
    }
    return this._eventPublisher.mergeObjectContext(new CategoryEntity(model.toJSON()));
  }

  public toPersistence(entity: CategoryEntity): CategoryAttributes {
    return {
      id: entity.get('id'),
      name: entity.get('name'),
      slug: entity.get('slug'),
      isActive: entity.get('isActive'),
      level: entity.get('level'),
      zindex: entity.get('zindex'),
      parentId: entity.get('parentId'),
      createdBy: entity.get('createdBy'),
      updatedBy: entity.get('updatedBy'),
      createdAt: entity.get('createdAt'),
      updatedAt: entity.get('updatedAt'),
    };
  }
}
