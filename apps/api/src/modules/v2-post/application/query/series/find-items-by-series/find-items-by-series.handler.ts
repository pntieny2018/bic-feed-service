import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { uniq } from 'lodash';

import {
  ISeriesDomainService,
  SERIES_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { ArticleEntity, PostEntity, SeriesEntity } from '../../../../domain/model/content';
import { FindItemsBySeriesDto } from '../../../dto';

import { FindItemsBySeriesQuery } from './find-items-by-series.query';

@QueryHandler(FindItemsBySeriesQuery)
export class FindItemsBySeriesHandler
  implements IQueryHandler<FindItemsBySeriesQuery, FindItemsBySeriesDto>
{
  public constructor(
    @Inject(SERIES_DOMAIN_SERVICE_TOKEN)
    private _seriesDomainService: ISeriesDomainService
  ) {}

  public async execute(query: FindItemsBySeriesQuery): Promise<FindItemsBySeriesDto> {
    const { seriesIds, authUser } = query.payload;

    const seriesEntities = await this._seriesDomainService.findSeriesByIds(seriesIds, true);

    if (seriesEntities.length === 0) {
      return new FindItemsBySeriesDto({ series: [] });
    }

    const ids = this._getItemIds(seriesEntities);
    const entities = await this._seriesDomainService.findItemsInSeries(ids, authUser.id);
    const entityMapper = new Map<string, PostEntity | ArticleEntity>(
      entities.map((item) => {
        return [item.getId(), item];
      })
    );

    const series = [];
    seriesEntities.forEach((seriesEntity) => {
      const items = [];
      seriesEntity.get('itemIds').forEach((id) => {
        if (entityMapper.has(id)) {
          const item = entityMapper.get(id);
          items.push({
            id: item.getId(),
            title: item instanceof PostEntity ? item.get('content') : item.get('title'),
            type: item.getType(),
          });
        }
      });
      series.push({
        id: seriesEntity.getId(),
        title: seriesEntity.get('title'),
        type: seriesEntity.getType(),
        items,
      });
    });

    return new FindItemsBySeriesDto({
      series,
    });
  }

  private _getItemIds(seriesEntities: SeriesEntity[]): string[] {
    const ids = [];
    seriesEntities.forEach((series: SeriesEntity) => {
      ids.push(...series.get('itemIds'));
    });

    return uniq(ids);
  }
}
