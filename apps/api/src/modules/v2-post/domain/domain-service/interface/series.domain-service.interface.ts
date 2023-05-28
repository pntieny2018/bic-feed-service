import { GroupDto } from '../../../../v2-group/application/group.dto';
import { CreateSeriesCommandPayload } from '../../../application/command/create-series/create-series.command';
import { UpdateSeriesCommandPayload } from '../../../application/command/update-series/update-series.command';
import { SeriesEntity } from '../../model/content/series.entity';

export type CreateSeriesProps = {
  data: CreateSeriesCommandPayload & {
    groups?: GroupDto[];
  };
};

export type UpdateSeriesProps = {
  seriesEntity: SeriesEntity;
  groups: GroupDto[];
  newData: UpdateSeriesCommandPayload;
};

export interface ISeriesDomainService {
  create(data: CreateSeriesProps): Promise<SeriesEntity>;
  update(input: UpdateSeriesProps): Promise<void>;
}
export const SERIES_DOMAIN_SERVICE_TOKEN = 'SERIES_DOMAIN_SERVICE_TOKEN';
