import { SeriesEntity } from '../model/content';

export interface ISeriesRepository {
  create(data: SeriesEntity): Promise<SeriesEntity>;
}

export const SERIES_REPOSITORY_TOKEN = 'SERIES_REPOSITORY_TOKEN';
