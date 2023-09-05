import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { SearchContentsQuery } from './search-contents.query';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../domain/domain-service/interface';
import { IPostElasticsearch } from '../../../../search';
import { SearchContentsDto } from './search-contents.dto';
import {
  CONTENT_BINDING_TOKEN,
  IContentBinding,
} from '../../binding/binding-post/content.interface';
import { createCursor } from '../../../../../common/dto/cusor-pagination';
import { SearchService } from '../../../../search/search.service';

@QueryHandler(SearchContentsQuery)
export class SearchContentsHandler
  implements IQueryHandler<SearchContentsQuery, SearchContentsDto>
{
  public constructor(
    private readonly _postSearchService: SearchService,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupAppService: IGroupApplicationService,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding
  ) {}

  public async execute(query: SearchContentsQuery): Promise<SearchContentsDto> {
    const {
      authUser,
      keyword,
      actors,
      startTime,
      endTime,
      tags,
      groupId,
      contentTypes,
      limit,
      after,
    } = query.payload;

    let groupIds: string[] = authUser.groups;

    if (groupId) {
      const group = await this._groupAppService.findOne(groupId);
      groupIds = this._groupAppService.getGroupIdAndChildIdsUserJoined(group, authUser.groups);
    }

    const excludeByIds = await this._contentDomainService.getReportedContentIdsByUser(
      authUser.id,
      contentTypes
    );

    const response = await this._postSearchService.searchContents<IPostElasticsearch>({
      keyword,
      actors,
      contentTypes,
      groupIds,
      startTime,
      endTime,
      excludeByIds,
      tags,
      size: limit,
      searchAfter: after,
      shouldHighligh: true,
    });

    const { source, total, cursor } = response;

    if (!source || !source.length || !total) {
      return new SearchContentsDto([], {
        hasNextPage: false,
      });
    }

    const contentEntities = await this._contentDomainService.getContentByIds({
      ids: source.map((item) => item.id),
      authUser,
    });

    const result = await this._contentBinding.contentsBinding(contentEntities, authUser);

    return new SearchContentsDto(result, {
      hasNextPage: total > source.length,
      endCursor: cursor ? createCursor(cursor) : '',
    });
  }
}
