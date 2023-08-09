import { SeriesEntity } from '../model/content';

export class SeriesCreatedEvent {
  public constructor(public readonly seriesEntity: SeriesEntity) {}
}
