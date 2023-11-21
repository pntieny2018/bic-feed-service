import { IEventPayload } from '@libs/infra/event';
import { UserDto } from '@libs/service/user';

import {
  PostHasBeenDeleted,
  PostHasBeenPublished,
  PostHasBeenScheduled,
  PostHasBeenUpdated,
  PostVideoHasBeenFailed,
  PostVideoHasBeenPublished,
} from '../../../../common/constants';
import { PostEntity } from '../model/content';

interface PostEventPayload {
  postEntity: PostEntity;
  authUser: UserDto;
}

export class PostPublishedEvent implements IEventPayload {
  public static event = PostHasBeenPublished;

  public payload: PostEventPayload;

  public constructor(data: PostEventPayload) {
    this.payload = data;
  }

  public getEventName(): string {
    return PostPublishedEvent.event;
  }
}

export class PostScheduledEvent implements IEventPayload {
  public static event = PostHasBeenScheduled;

  public payload: PostEventPayload;

  public constructor(data: PostEventPayload) {
    this.payload = data;
  }

  public getEventName(): string {
    return PostScheduledEvent.event;
  }
}

export class PostDeletedEvent implements IEventPayload {
  public static event = PostHasBeenDeleted;

  public payload: PostEventPayload;

  public constructor(data: PostEventPayload) {
    this.payload = data;
  }

  public getEventName(): string {
    return PostDeletedEvent.event;
  }
}

export class PostUpdatedEvent implements IEventPayload {
  public static event = PostHasBeenUpdated;

  public payload: PostEventPayload;

  public constructor(data: PostEventPayload) {
    this.payload = data;
  }

  public getEventName(): string {
    return PostUpdatedEvent.event;
  }
}

export class PostVideoSuccessEvent implements IEventPayload {
  public static event = PostVideoHasBeenPublished;

  public payload: PostEventPayload;

  public constructor(data: PostEventPayload) {
    this.payload = data;
  }

  public getEventName(): string {
    return PostVideoSuccessEvent.event;
  }
}

export class PostVideoFailedEvent implements IEventPayload {
  public static event = PostVideoHasBeenFailed;

  public payload: PostEventPayload;

  public constructor(data: PostEventPayload) {
    this.payload = data;
  }

  public getEventName(): string {
    return PostVideoFailedEvent.event;
  }
}
