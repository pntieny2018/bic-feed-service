import { Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { ISeriesFactory } from './interface';
import { SeriesEntity, SeriesProps } from '../model/post/series.entity';

export class SeriesFactory implements ISeriesFactory {
  @Inject(EventPublisher) private readonly _eventPublisher: EventPublisher;

  public reconstitute(properties: SeriesProps): SeriesEntity {
    return this._eventPublisher.mergeObjectContext(new SeriesEntity(properties));
  }
}
