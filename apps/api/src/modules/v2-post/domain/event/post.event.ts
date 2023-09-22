import { IEventPayload } from '@libs/infra/event';
import { UserDto } from '@libs/service/user';

import { PostHasBeenPublished } from '../../../../common/constants';
import { PostEntity } from '../model/content';

interface PostPublishedEventPayload {
  postEntity: PostEntity;
  actor: UserDto;
}

export class PostPublishedEvent implements IEventPayload {
  public static event = PostHasBeenPublished;

  public payload: PostPublishedEventPayload;

  public constructor(data: PostPublishedEventPayload) {
    this.payload = data;
  }
}
