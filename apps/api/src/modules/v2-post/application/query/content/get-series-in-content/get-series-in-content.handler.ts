import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';
import { IMediaBinding, MEDIA_BINDING_TOKEN } from '../../../binding/binding-media';
import { SeriesDto, GetSeriesResponseDto } from '../../../dto';

import { GetSeriesInContentQuery } from './get-series-in-content.query';

@QueryHandler(GetSeriesInContentQuery)
export class GetSeriesInContentHandler
  implements IQueryHandler<GetSeriesInContentQuery, GetSeriesResponseDto>
{
  public constructor(
    @Inject(MEDIA_BINDING_TOKEN)
    private readonly _mediaBinding: IMediaBinding,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomain: IContentDomainService
  ) {}

  public async execute(query: GetSeriesInContentQuery): Promise<GetSeriesResponseDto> {
    const { contentId, authUser } = query.payload;

    const seriesEntities = await this._contentDomain.getSeriesInContent(contentId, authUser.id);

    const series = seriesEntities.map((seriesEntity) => {
      return new SeriesDto({
        id: seriesEntity.get('id'),
        title: seriesEntity.get('title'),
        summary: seriesEntity.get('summary'),
        coverMedia: this._mediaBinding.imageBinding(seriesEntity.get('cover')),
      });
    });

    return new GetSeriesResponseDto(series);
  }
}
