import { CONTENT_TYPE } from '@beincom/constants';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PageDto } from '../../../../../../common/dto';
import { IPostElasticsearch } from '../../../../../search';
import { SearchService } from '../../../../../search/search.service';
import { ImageDto, SearchSeriesDto } from '../../../dto';

import { SearchSeriesQuery } from './search-series.query';

@QueryHandler(SearchSeriesQuery)
export class SearchSeriesHandler
  implements IQueryHandler<SearchSeriesQuery, PageDto<SearchSeriesDto>>
{
  public constructor(private readonly _postSearchService: SearchService) {}

  public async execute(query: SearchSeriesQuery): Promise<PageDto<SearchSeriesDto>> {
    const { authUser, limit, offset, groupIds, contentSearch, itemIds } = query.payload;

    if (!authUser || authUser.groups.length === 0) {
      return new PageDto<SearchSeriesDto>([], {
        total: 0,
        limit,
        offset,
      });
    }

    let filterGroupIds = [];
    if (groupIds && groupIds.length) {
      filterGroupIds = groupIds.filter((groupId) => authUser.groups.includes(groupId));
    }

    const response = await this._postSearchService.searchContents<IPostElasticsearch>({
      keyword: contentSearch,
      contentTypes: [CONTENT_TYPE.SERIES],
      groupIds: filterGroupIds,
      itemIds,
      from: offset,
      size: limit,
    });

    const { source, total } = response;

    const series = source.map((item) => {
      return new SearchSeriesDto({
        id: item.id,
        coverMedia: new ImageDto(item.coverMedia),
        title: item.title || null,
        summary: item.summary,
      });
    });

    return new PageDto<SearchSeriesDto>(series, {
      total,
      limit,
      offset,
    });
  }
}
