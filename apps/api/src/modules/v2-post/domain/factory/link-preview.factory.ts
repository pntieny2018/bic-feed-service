import { v4 } from 'uuid';
import { Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import {
  ILinkPreviewFactory,
  CreateLinkPreviewProps,
} from './interface/link-preview.factory.interface';
import { LinkPreviewEntity, LinkPreviewAttributes } from '../model/link-preview';

export class LinkPreviewFactory implements ILinkPreviewFactory {
  @Inject(EventPublisher) private readonly _eventPublisher: EventPublisher;

  public createLinkPreview(options: CreateLinkPreviewProps): LinkPreviewEntity {
    const { title, description, domain, url, image } = options;
    const now = new Date();
    const entity = new LinkPreviewEntity({
      id: v4(),
      title,
      description,
      domain,
      image,
      url,
      createdAt: now,
      updatedAt: now,
    });

    return this._eventPublisher.mergeObjectContext(entity);
  }

  public reconstitute(properties: LinkPreviewAttributes): LinkPreviewEntity {
    return this._eventPublisher.mergeObjectContext(new LinkPreviewEntity(properties));
  }
}
