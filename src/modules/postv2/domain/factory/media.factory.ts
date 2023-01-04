import { Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { MediaStatus, MediaType } from '../../data-type';
import { Media, MediaProperties } from '../model/media/media';

type CreateMediaOptions = Readonly<{
  id: string;
  name: string;
  originName: string;
  size: number;
  url: string;
  width: number;
  height: number;
  type: MediaType;
  createdBy: string;
  mimeType: string;
  extension: string;
  status: MediaStatus;
  createdAt: Date;
}>;

export class MediaFactory {
  @Inject(EventPublisher) private readonly _eventPublisher: EventPublisher;

  public create(options: CreateMediaOptions): any {
    const {
      id,
      name,
      originName,
      size,
      url,
      width,
      height,
      type,
      createdBy,
      status,
      mimeType,
      extension,
      createdAt,
    } = options;
    return this._eventPublisher.mergeObjectContext(
      new Media({
        id,
        name,
        originName,
        size,
        url,
        width,
        height,
        type,
        mimeType,
        extension,
        createdBy,
        status,
        createdAt,
      })
    );
  }

  public reconstitute(properties: MediaProperties): Media {
    return this._eventPublisher.mergeObjectContext(new Media(properties));
  }
}
