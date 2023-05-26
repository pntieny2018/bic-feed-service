import { GroupDto } from '../../../../v2-group/application/group.dto';
import { CreateSeriesCommandPayload } from '../../../application/command/create-series/create-series.command';
import { SeriesEntity } from '../../model/content/series.entity';

export type CreateSeriesProps = {
  data: CreateSeriesCommandPayload & {
    groups?: GroupDto[];
  };
};

export interface ISeriesDomainService {
  create(data: CreateSeriesProps): Promise<SeriesEntity>;
}
export const SERIES_DOMAIN_SERVICE_TOKEN = 'SERIES_DOMAIN_SERVICE_TOKEN';
