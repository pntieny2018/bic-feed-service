import { UserDto } from '@libs/service/user';

import { SeriesEntity } from '../model/content';

export type SeriesItemsAddedPayload = {
  authUser: UserDto;
  seriesId: string;
  itemId: string;
  skipNotify?: boolean;
  context: 'publish' | 'add'; // publish: when publish post,article edit post, article; add when series add item
};

export class SeriesCreatedEvent {
  public constructor(public readonly seriesEntity: SeriesEntity) {}
}

export class SeriesUpdatedEvent {
  public constructor(public readonly seriesEntity: SeriesEntity) {}
}

export class SeriesDeletedEvent {
  public constructor(public readonly seriesEntity: SeriesEntity) {}
}

export class SeriesItemsReoderedEvent {
  public constructor(public readonly seriesId: string) {}
}

export class SeriesItemsAddedEvent {
  public constructor(public readonly payload: SeriesItemsAddedPayload) {}
}
