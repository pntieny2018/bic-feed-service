import {
  LinkPreviewAttributes,
  LinkPreviewModel,
} from '@libs/database/postgres/model/link-preview.model';
import { Inject, Injectable } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';

import { LinkPreviewEntity } from '../../domain/model/link-preview';

@Injectable()
export class LinkPreviewMapper {
  public constructor(@Inject(EventPublisher) private readonly _eventPublisher: EventPublisher) {}

  public toDomain(model: LinkPreviewModel): LinkPreviewEntity {
    if (model === null) {
      return null;
    }
    return this._eventPublisher.mergeObjectContext(new LinkPreviewEntity(model.toJSON()));
  }

  public toPersistence(entity: LinkPreviewEntity): LinkPreviewAttributes {
    return {
      id: entity.get('id'),
      title: entity.get('title'),
      description: entity.get('description'),
      url: entity.get('url'),
      domain: entity.get('domain'),
      image: entity.get('image'),
      createdAt: entity.get('createdAt'),
      updatedAt: entity.get('updatedAt'),
    };
  }
}
