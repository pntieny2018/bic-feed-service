import { Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { MediaStatus, MediaType, PostPrivacy, PostType } from '../../../data-type';
import { Media } from './media';
import { Post, PostProperties } from './post';

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
  status: MediaStatus;
  createdAt: Date;
  updatedAt: Date;
}>;

export class PostFactory {
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
      createdAt,
      updatedAt,
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
        createdBy,
        updatedBy: createdBy,
        status,
        createdAt,
        updatedAt,
      })
    );
  }

  public reconstitute(properties: PostProperties): Post {
    return this._eventPublisher.mergeObjectContext(new Post(properties));
  }
}
