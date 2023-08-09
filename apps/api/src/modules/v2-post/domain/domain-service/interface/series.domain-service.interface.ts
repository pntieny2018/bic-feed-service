import { CreateSeriesCommandPayload } from '../../../application/command/create-series/create-series.command';
import { UpdateSeriesCommandPayload } from '../../../application/command/update-series/update-series.command';
import { SeriesEntity } from '../../model/content';
import { DeleteSeriesCommandPayload } from '../../../application/command/delete-series/delete-series.command';

export type CreateSeriesProps = CreateSeriesCommandPayload;

export type UpdateSeriesProps = UpdateSeriesCommandPayload;

export type DeleteSeriesProps = DeleteSeriesCommandPayload;

export interface ISeriesDomainService {
  create(data: CreateSeriesProps): Promise<SeriesEntity>;
  update(input: UpdateSeriesProps): Promise<SeriesEntity>;
  delete(input: DeleteSeriesProps): Promise<void>;
}
export const SERIES_DOMAIN_SERVICE_TOKEN = 'SERIES_DOMAIN_SERVICE_TOKEN';
