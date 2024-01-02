import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  ISeriesDomainService,
  SERIES_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { ContentBinding, CONTENT_BINDING_TOKEN } from '../../../binding';
import { SeriesDto } from '../../../dto';

import { FindSeriesQuery } from './find-series.query';

@QueryHandler(FindSeriesQuery)
export class FindSeriesHandler implements IQueryHandler<FindSeriesQuery, SeriesDto> {
  public constructor(
    @Inject(SERIES_DOMAIN_SERVICE_TOKEN) private readonly _seriesDomain: ISeriesDomainService,
    @Inject(CONTENT_BINDING_TOKEN) private readonly _contentBinding: ContentBinding
  ) {}

  public async execute(query: FindSeriesQuery): Promise<SeriesDto> {
    const { seriesId, authUser } = query.payload;
    const seriesEntity = await this._seriesDomain.getSeriesById(seriesId, authUser);

    return this._contentBinding.seriesBinding(seriesEntity, {
      authUser,
    });
  }
}
