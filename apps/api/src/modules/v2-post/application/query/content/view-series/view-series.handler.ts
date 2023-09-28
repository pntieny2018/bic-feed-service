import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';
import { ImageDto, SeriesDto, ViewSeriesResponseDto } from '../../../dto';

import { ViewSeriesQuery } from './view-series.query';

@QueryHandler(ViewSeriesQuery)
export class ViewSeriesHandler implements IQueryHandler<ViewSeriesQuery, ViewSeriesResponseDto> {
  public constructor(
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService
  ) {}

  public async execute(query: ViewSeriesQuery): Promise<ViewSeriesResponseDto> {
    const { contentId, authUser } = query.payload;

    const seriesEntites = await this._contentDomainService.viewSeries(contentId, authUser.id);

    const series = seriesEntites.map((seriesEntity) => {
      return new SeriesDto({
        id: seriesEntity.get('id'),
        title: seriesEntity.get('title'),
        summary: seriesEntity.get('summary'),
        coverMedia: seriesEntity.get('cover')
          ? new ImageDto(seriesEntity.get('cover')?.toObject())
          : null,
      });
    });

    return new ViewSeriesResponseDto(series);
  }
}
