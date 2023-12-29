import { IEventPayload } from '@libs/infra/event';
import { UserDto } from '@libs/service/user';

import {
  ArticleHasBeenDeleted,
  ArticleHasBeenPublished,
  ArticleHasBeenUpdated,
} from '../../../../common/constants';
import { ArticleEntity } from '../model/content';

interface ArticleEventPayload {
  entity: ArticleEntity;
  authUser: UserDto;
}
export class ArticleDeletedEvent implements IEventPayload {
  public static event = ArticleHasBeenDeleted;

  public payload: ArticleEventPayload;

  public constructor(data: ArticleEventPayload) {
    this.payload = data;
  }

  public getEventName(): string {
    return ArticleDeletedEvent.event;
  }
}

export class ArticleUpdatedEvent implements IEventPayload {
  public static event = ArticleHasBeenUpdated;

  public payload: ArticleEventPayload;

  public constructor(data: ArticleEventPayload) {
    this.payload = data;
  }

  public getEventName(): string {
    return ArticleUpdatedEvent.event;
  }
}

export class ArticlePublishedEvent implements IEventPayload {
  public static event = ArticleHasBeenPublished;

  public payload: ArticleEventPayload;

  public constructor(data: ArticleEventPayload) {
    this.payload = data;
  }

  public getEventName(): string {
    return ArticlePublishedEvent.event;
  }
}
