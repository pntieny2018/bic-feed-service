import { SeriesEntity, SeriesProps } from '../../model/content';

export type BasedSeriesAttribute = {
  userId: string;

  summary: string;

  title: string;
};

export interface ISeriesFactory {
  createSeries(props: BasedSeriesAttribute): SeriesEntity;
  reconstitute(props: SeriesProps): SeriesEntity;
}

export const SERIES_FACTORY_TOKEN = 'SERIES_FACTORY_TOKEN';
