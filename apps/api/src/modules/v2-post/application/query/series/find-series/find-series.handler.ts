import {
  ISeriesDomainService,
  SERIES_DOMAIN_SERVICE_TOKEN,
} from '@api/modules/v2-post/domain/domain-service/interface';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { GROUP_ADAPTER, IGroupAdapter } from '../../../../domain/service-adapter-interface';
import { IPostValidator, POST_VALIDATOR_TOKEN } from '../../../../domain/validator/interface';
import { ContentBinding, CONTENT_BINDING_TOKEN } from '../../../binding';
import { SeriesDto } from '../../../dto';

import { FindSeriesQuery } from './find-series.query';

@QueryHandler(FindSeriesQuery)
export class FindSeriesHandler implements IQueryHandler<FindSeriesQuery, SeriesDto> {
  public constructor(
    @Inject(GROUP_ADAPTER) private readonly _groupAdapter: IGroupAdapter,
    @Inject(SERIES_DOMAIN_SERVICE_TOKEN)
    private readonly _seriesDomainService: ISeriesDomainService,
    @Inject(POST_VALIDATOR_TOKEN) private readonly _postValidator: IPostValidator,
    @Inject(CONTENT_BINDING_TOKEN) private readonly _contentBinding: ContentBinding
  ) {}

  public async execute(query: FindSeriesQuery): Promise<SeriesDto> {
    const { seriesId, authUser } = query.payload;
    const seriesEntity = await this._seriesDomainService.getSeriesById(seriesId, authUser);
    const groups = await this._groupAdapter.getGroupsByIds(seriesEntity.get('groupIds'));
    await this._postValidator.checkCanReadContent(seriesEntity, authUser, groups);

    return this._contentBinding.seriesBinding(seriesEntity, {
      groups,
      authUser,
    });
  }
}
