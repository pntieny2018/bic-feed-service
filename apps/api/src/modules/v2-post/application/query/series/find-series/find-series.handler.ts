import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CONTENT_REPOSITORY_TOKEN } from '../../../../domain/repositoty-interface';
import { CONTENT_BINDING_TOKEN, ContentBinding } from '../../../binding';
import { SeriesDto } from '../../../dto';

import { FindSeriesQuery } from './find-series.query';
import {
  ISeriesDomainService,
  SERIES_DOMAIN_SERVICE_TOKEN,
} from '@api/modules/v2-post/domain/domain-service/interface';

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
