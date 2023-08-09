import { SeriesEntity } from '../model/content';

export class SeriesUpdatedEvent {
  public constructor(public readonly seriesEntity: SeriesEntity) {}
}
