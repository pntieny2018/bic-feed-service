import { SeriesEntity } from '../model/content';

export class SeriesDeletedEvent {
  public constructor(public readonly seriesEntity: SeriesEntity) {}
}
