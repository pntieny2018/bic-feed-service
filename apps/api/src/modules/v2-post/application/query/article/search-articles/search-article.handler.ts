import { PageDto } from '@api/common/dto';
import { IPostElasticsearch } from '@api/modules/search';
import { SearchService } from '@api/modules/search/search.service';
import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '@api/modules/v2-post/domain/domain-service/interface';
import {
  IReportRepository,
  REPORT_REPOSITORY_TOKEN,
} from '@api/modules/v2-post/domain/repositoty-interface';
import { CONTENT_TARGET, CONTENT_TYPE } from '@beincom/constants';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../../binding';
import { ArticleDto } from '../../../dto';

import { SearchArticlesQuery } from './search-article.query';

@QueryHandler(SearchArticlesQuery)
export class SearchArticlesHandler implements IQueryHandler<SearchArticlesQuery> {
  public constructor(
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomain: IContentDomainService,
    @Inject(REPORT_REPOSITORY_TOKEN)
    private readonly _reportRepo: IReportRepository,
    private readonly _searchService: SearchService
  ) {}

  public async execute(query: SearchArticlesQuery): Promise<PageDto<ArticleDto>> {
    const { limit, offset, groupIds, categoryIds, contentSearch, limitSeries } =
      query.payload.searchDto;
    const authUser = query.payload.user;

    if (!authUser || authUser.groups.length === 0 || (!groupIds && !categoryIds)) {
      return new PageDto<ArticleDto>([], {
        total: 0,
        limit,
        offset,
      });
    }

    let filterGroupIds = authUser.groups;
    if (groupIds) {
      filterGroupIds = groupIds.filter((groupId) => authUser.groups.includes(groupId));
    }
    const excludeByIds = await this._reportRepo.getReportedTargetIdsByReporterId({
      reporterId: authUser.id,
      groupIds,
      targetTypes: [CONTENT_TARGET.ARTICLE],
    });

    const response = await this._searchService.searchContents<IPostElasticsearch>({
      keyword: contentSearch,
      contentTypes: [CONTENT_TYPE.ARTICLE],
      groupIds: filterGroupIds,
      excludeByIds,
      topics: categoryIds,
      from: offset,
      size: limit,
      isLimitSeries: limitSeries,
    });

    const { source, total } = response;

    const articleEntities = await this._contentDomain.getContentByIds({
      ids: source.map((item) => item.id),
      authUserId: authUser.id,
    });

    const result = (await this._contentBinding.contentsBinding(
      articleEntities,
      authUser
    )) as ArticleDto[];

    return new PageDto<ArticleDto>(result, {
      total,
      limit,
      offset,
    });
  }
}
