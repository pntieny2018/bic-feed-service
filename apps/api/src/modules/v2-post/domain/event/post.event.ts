import { IEventPayload } from '@libs/infra/event';
import { UserDto } from '@libs/service/user';

import { PostHasBeenPublished, PostHasBeenScheduled } from '../../../../common/constants';
import { PostEntity } from '../model/content';

interface PostEventPayload {
  postEntity: PostEntity;
  actor: UserDto;
}

export class PostPublishedEvent implements IEventPayload {
  public static event = PostHasBeenPublished;

  public payload: PostEventPayload;

  public constructor(data: PostEventPayload) {
    this.payload = data;
  }
}

export class PostScheduledEvent implements IEventPayload {
  public static event = PostHasBeenScheduled;

  public payload: PostEventPayload;

  public constructor(data: PostEventPayload) {
    this.payload = data;
  }
}
