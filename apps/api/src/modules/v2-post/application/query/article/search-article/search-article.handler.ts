import { CONTENT_TYPE } from '@beincom/constants';
import { PaginatedResponse, createCursor, parseCursor } from '@libs/database/postgres/common';
import { GroupDto } from '@libs/service/group';
import { UserDto } from '@libs/service/user';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { flatten, uniq } from 'lodash';

import { ELASTICSEARCH_DEFAULT_SIZE_PAGE, IPostElasticsearch } from '../../../../../search';
import { SearchService } from '../../../../../search/search.service';
import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';
import {
  GROUP_ADAPTER,
  IGroupAdapter,
  IUserAdapter,
  USER_ADAPTER,
} from '../../../../domain/service-adapter-interface';
import { ImageDto, SearchArticleDto } from '../../../dto';

import { SearchArticleQuery } from './search-article.query';

@QueryHandler(SearchArticleQuery)
export class SearchArticleHandler
  implements IQueryHandler<SearchArticleQuery, PaginatedResponse<SearchArticleDto>>
{
  public constructor(
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter,
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,
    private readonly _postSearchService: SearchService
  ) {}

  public async execute(query: SearchArticleQuery): Promise<PaginatedResponse<SearchArticleDto>> {
    const {
      authUser,
      limitSeries,
      groupIds,
      contentSearch,
      categoryIds,
      limit = ELASTICSEARCH_DEFAULT_SIZE_PAGE,
      after,
    } = query.payload;

    if (!groupIds && !categoryIds) {
      return new PaginatedResponse<SearchArticleDto>([], {
        total: 0,
        hasNextPage: false,
      });
    }

    let filterGroupIds = [];
    if (groupIds && groupIds.length) {
      filterGroupIds = groupIds.filter((groupId) => authUser.groups.includes(groupId));
    }

    const excludeByIds = await this._contentDomainService.getReportedContentIdsByUser(authUser.id, {
      postTypes: [CONTENT_TYPE.ARTICLE, CONTENT_TYPE.POST],
      groupIds,
    });

    const response = await this._postSearchService.searchContents<IPostElasticsearch>({
      keyword: contentSearch,
      filterEmptyContent: true,
      contentTypes: [CONTENT_TYPE.ARTICLE, CONTENT_TYPE.POST],
      groupIds: filterGroupIds,
      excludeByIds,
      isLimitSeries: limitSeries,
      topics: categoryIds,
      size: limit,
      searchAfter: after ? parseCursor(after) : undefined,
    });

    const { source, total, cursor } = response;

    if (!source || !source.length) {
      return new PaginatedResponse<SearchArticleDto>([], {
        total: 0,
        hasNextPage: false,
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

    const users = await this._userAdapter.findAllAndFilterByPersonalVisibility(
      uniq(source.map((item) => item.createdBy)),
      authUser.id
    );
    const usersMapper = new Map<string, UserDto>(
      users.map((user) => {
        return [user.id, user];
      })
    );

    const series = source.map((item) => {
      return new SearchArticleDto({
        id: item.id,
        coverMedia: new ImageDto(item.coverMedia),
        title: item.title,
        summary: item.summary,
        categories: item.categories,
        media: item.media,
        content: item.content,
        audience: {
          groups: (item.groupIds || [])
            .filter((groupId) => audienceMapper.has(groupId))
            .map((groupId) => audienceMapper.get(groupId)),
        },
        type: item.type as unknown as CONTENT_TYPE,
        actor: usersMapper.get(item.createdBy),
      });
    });

    return new PaginatedResponse<SearchArticleDto>(series, {
      total,
      hasNextPage: limit <= source.length,
      endCursor: cursor ? createCursor(cursor) : '',
    });
  }
}
