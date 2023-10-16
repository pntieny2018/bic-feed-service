import { SeriesEntity, SeriesAttributes } from '../../model/content';

export type BasedSeriesProps = {
  userId: string;
  summary: string;
  title: string;
};

export interface ISeriesFactory {
  createSeries(props: BasedSeriesProps): SeriesEntity;
  reconstitute(props: SeriesAttributes): SeriesEntity;
}

export const SERIES_FACTORY_TOKEN = 'SERIES_FACTORY_TOKEN';
