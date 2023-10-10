import { SeriesEntity } from '../model/content';

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
