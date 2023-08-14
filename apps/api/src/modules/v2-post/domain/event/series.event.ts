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
