import {
  CreateSeriesCommandPayload,
  DeleteSeriesCommandPayload,
  UpdateSeriesCommandPayload,
  AddSeriesItemsCommandPayload,
  RemoveSeriesItemsCommandPayload,
} from '../../../application/command/series';
import { ArticleEntity, PostEntity, SeriesEntity } from '../../model/content';

export type CreateSeriesProps = CreateSeriesCommandPayload;

export type UpdateSeriesProps = UpdateSeriesCommandPayload;

export type DeleteSeriesProps = DeleteSeriesCommandPayload;

export type AddSeriesItemsProps = AddSeriesItemsCommandPayload;

export type RemoveSeriesItemsProps = RemoveSeriesItemsCommandPayload;

export interface ISeriesDomainService {
  findSeriesByIds(seriesIds: string[], withItems?: boolean): Promise<SeriesEntity[]>;
  findItemsInSeries(itemIds: string[], authUserId: string): Promise<(PostEntity | ArticleEntity)[]>;
  create(data: CreateSeriesProps): Promise<SeriesEntity>;
  update(input: UpdateSeriesProps): Promise<SeriesEntity>;
  delete(input: DeleteSeriesProps): Promise<void>;
  addSeriesItems(input: AddSeriesItemsProps): Promise<void>;
  removeSeriesItems(input: RemoveSeriesItemsProps): Promise<void>;
}
export const SERIES_DOMAIN_SERVICE_TOKEN = 'SERIES_DOMAIN_SERVICE_TOKEN';
