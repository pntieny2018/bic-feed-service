import { v4 } from 'uuid';
import { StringHelper } from '../../../../common/helpers';
import { TagEntity, TagProps } from '../model/tag';
import { CreateTagProps, ITagFactory } from './interface';
import { Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { ILinkPreviewFactory } from './interface/link-preview.factory.interface';
import { LinkPreviewDto } from '../../application/dto';
import { LinkPreviewEntity, LinkPreviewProps } from '../model/link-preview';

export class LinkPreviewFactory implements ILinkPreviewFactory {
  @Inject(EventPublisher) private readonly _eventPublisher: EventPublisher;

  public createLinkPreview(options: LinkPreviewDto): LinkPreviewEntity {
    const { title, description, domain, url, image } = options;
    const now = new Date();
    const entity = new LinkPreviewEntity({
      id: v4(),
      title,
      description,
      domain,
      url,
      createdAt: now,
      updatedAt: now,
    });

    return this._eventPublisher.mergeObjectContext(entity);
  }

  public reconstitute(properties: LinkPreviewProps): LinkPreviewEntity {
    return this._eventPublisher.mergeObjectContext(new LinkPreviewEntity(properties));
  }
}
