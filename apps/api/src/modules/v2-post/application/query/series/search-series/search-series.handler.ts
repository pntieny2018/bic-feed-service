import { CONTENT_TYPE } from '@beincom/constants';
import { GroupDto } from '@libs/service/group';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { flatten } from 'lodash';

import { PageDto } from '../../../../../../common/dto';
import { IPostElasticsearch } from '../../../../../search';
import { SearchService } from '../../../../../search/search.service';
import { GROUP_ADAPTER, IGroupAdapter } from '../../../../domain/service-adapter-interface';
import { ImageDto, SearchSeriesDto } from '../../../dto';

import { SearchSeriesQuery } from './search-series.query';

@QueryHandler(SearchSeriesQuery)
export class SearchSeriesHandler
  implements IQueryHandler<SearchSeriesQuery, PageDto<SearchSeriesDto>>
{
  public constructor(
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    private readonly _postSearchService: SearchService
  ) {}

  public async execute(query: SearchSeriesQuery): Promise<PageDto<SearchSeriesDto>> {
    const { authUser, limit, offset, groupIds, contentSearch, itemIds } = query.payload;

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

    if (!source || !source.length) {
      return new PageDto<SearchSeriesDto>([], {
        total: 0,
        limit,
        offset,
      });
    }

    const audienceIds = flatten(
      source.map((item) =>
        (item.groupIds || []).filter((groupId) => authUser.groups.includes(groupId))
      )
    );
    const audiences = await this._groupAdapter.getGroupsByIds(audienceIds);
    const audienceMapper = new Map<string, GroupDto>(
      audiences.map((audience) => {
        return [audience.id, audience];
      })
    );

    const series = source.map((item) => {
      return new SearchSeriesDto({
        id: item.id,
        audience: {
          groups: (item.groupIds || [])
            .filter((groupId) => audienceMapper.has(groupId))
            .map((groupId) => audienceMapper.get(groupId)),
        },
        coverMedia: new ImageDto(item.coverMedia),
        title: item.title || '',
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
