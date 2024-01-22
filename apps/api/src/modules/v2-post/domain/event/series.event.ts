import { IEventPayload } from '@libs/infra/event';
import { UserDto } from '@libs/service/user';

import {
  SeriesHasBeenAddItem,
  SeriesHasBeenDeleted,
  SeriesHasBeenPublished,
  SeriesHasBeenRemoveItem,
  SeriesHasBeenReorderItem,
  SeriesHasBeenSameOwnerChanged,
  SeriesHasBeenUpdated,
} from '../../../../common/constants';
import { ArticleEntity, PostEntity, SeriesEntity } from '../model/content';

interface SeriesEventPayload {
  entity: SeriesEntity;
  authUser: UserDto;
}

export interface SeriesItemsAddedPayload {
  authUser: UserDto;
  seriesId: string;
  item: PostEntity | ArticleEntity;
  skipNotify?: boolean;
  context: 'publish' | 'add'; // publish: when publish or edited content || add: when content is added into series
}

export interface SeriesItemsRemovedPayload {
  authUser: UserDto;
  seriesId: string;
  item: PostEntity | ArticleEntity;
  skipNotify?: boolean;
  contentIsDeleted: boolean; // true: when content is deleted || false: when content is removed from series
}

export interface SeriesSameOwnerChangedPayload {
  authUser: UserDto;
  series: { item: SeriesEntity; state: 'add' | 'remove' }[];
  content: PostEntity | ArticleEntity;
}

export class SeriesPublishedEvent implements IEventPayload {
  public static event = SeriesHasBeenPublished;

  public payload: SeriesEventPayload;

  public constructor(data: SeriesEventPayload) {
    this.payload = data;
  }

  public getEventName(): string {
    return SeriesPublishedEvent.event;
  }
}

export class SeriesUpdatedEvent implements IEventPayload {
  public static event = SeriesHasBeenUpdated;

  public payload: SeriesEventPayload;

  public constructor(data: SeriesEventPayload) {
    this.payload = data;
  }

  public getEventName(): string {
    return SeriesUpdatedEvent.event;
  }
}

export class SeriesDeletedEvent implements IEventPayload {
  public static event = SeriesHasBeenDeleted;

  public payload: SeriesEventPayload;

  public constructor(data: SeriesEventPayload) {
    this.payload = data;
  }

  public getEventName(): string {
    return SeriesDeletedEvent.event;
  }
}

export class SeriesItemsReorderedEvent implements IEventPayload {
  public static event = SeriesHasBeenReorderItem;

  public payload: { seriesId: string };

  public constructor(seriesId: string) {
    this.payload = { seriesId };
  }

  public getEventName(): string {
    return SeriesItemsReorderedEvent.event;
  }
}

export class SeriesItemsAddedEvent implements IEventPayload {
  public static event = SeriesHasBeenAddItem;

  public payload: SeriesItemsAddedPayload;

  public constructor(data: SeriesItemsAddedPayload) {
    this.payload = data;
  }

  public getEventName(): string {
    return SeriesItemsAddedEvent.event;
  }
}

export class SeriesItemsRemovedEvent implements IEventPayload {
  public static event = SeriesHasBeenRemoveItem;

  public payload: SeriesItemsRemovedPayload;

  public constructor(data: SeriesItemsRemovedPayload) {
    this.payload = data;
  }

  public getEventName(): string {
    return SeriesItemsRemovedEvent.event;
  }
}

export class SeriesSameOwnerChangedEvent implements IEventPayload {
  public static event = SeriesHasBeenSameOwnerChanged;

  public payload: SeriesSameOwnerChangedPayload;

  public constructor(data: SeriesSameOwnerChangedPayload) {
    this.payload = data;
  }

  public getEventName(): string {
    return SeriesSameOwnerChangedEvent.event;
  }
}
