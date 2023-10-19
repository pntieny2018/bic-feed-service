import { UserDto } from '@libs/service/user';

import { ArticleEntity, PostEntity, SeriesEntity } from '../model/content';

export type SeriesItemsAddedPayload = {
  authUser: UserDto;
  seriesId: string;
  item: PostEntity | ArticleEntity;
  skipNotify?: boolean;
  context: 'publish' | 'add'; // publish: when publish or edited content || add: when content is added into series
};

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

export class SeriesCreatedEvent {
  public constructor(public readonly seriesEntity: SeriesEntity, public readonly actor: UserDto) {}
}

export class SeriesUpdatedEvent {
  public constructor(public readonly seriesEntity: SeriesEntity, public readonly actor: UserDto) {}
}

export class SeriesDeletedEvent {
  public constructor(public readonly seriesEntity: SeriesEntity, public readonly actor: UserDto) {}
}

export class SeriesItemsReoderedEvent {
  public constructor(public readonly seriesId: string) {}
}

export class SeriesItemsAddedEvent {
  public constructor(public readonly payload: SeriesItemsAddedPayload) {}
}

export class SeriesItemsRemovedEvent {
  public constructor(public readonly payload: SeriesItemsRemovedPayload) {}
}

export class SeriesSameOwnerChangedEvent {
  public constructor(public readonly payload: SeriesSameOwnerChangedPayload) {}
}
