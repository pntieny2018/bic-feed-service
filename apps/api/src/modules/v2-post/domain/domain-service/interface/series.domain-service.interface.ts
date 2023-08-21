import {
  CreateSeriesCommandPayload,
  DeleteSeriesCommandPayload,
  UpdateSeriesCommandPayload,
} from '../../../application/command/series';
import { SeriesEntity } from '../../model/content';

export type CreateSeriesProps = CreateSeriesCommandPayload;

export type UpdateSeriesProps = UpdateSeriesCommandPayload;

export type DeleteSeriesProps = DeleteSeriesCommandPayload;

export interface ISeriesDomainService {
  create(data: CreateSeriesProps): Promise<SeriesEntity>;
  update(input: UpdateSeriesProps): Promise<SeriesEntity>;
  delete(input: DeleteSeriesProps): Promise<void>;
}
export const SERIES_DOMAIN_SERVICE_TOKEN = 'SERIES_DOMAIN_SERVICE_TOKEN';
