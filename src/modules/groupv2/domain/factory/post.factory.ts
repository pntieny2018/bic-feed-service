import { Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { PostPrivacy, PostType } from '../../data-type';
import { Post, PostProperties } from '../model/post';

type CreatePostOptions = Readonly<{
  id: string;
  createdBy: string;
}>;

export class PostFactory {
  @Inject(EventPublisher) private readonly _eventPublisher: EventPublisher;

  public create(options: CreatePostOptions): any {
    const { id } = options;
    // return this._eventPublisher.mergeObjectContext(
    //   // new Post({
    //   //   id,
    //   //   type: PostType.POST,
    //   //   isDraft: true,
    //   //   createdBy: createdBy,
    //   //   postPrivacy: PostPrivacy.OPEN,
    //   // })
    // );
  }

  public reconstitute(properties: PostProperties): Post {
    return this._eventPublisher.mergeObjectContext(new Post(properties));
  }
}
