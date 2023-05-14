import { SeriesEntity, SeriesProps } from '../../model/post/series.entity';

export interface ISeriesFactory {
  reconstitute(props: SeriesProps): SeriesEntity;
}

export const SERIES_FACTORY_TOKEN = 'SERIES_FACTORY_TOKEN';
